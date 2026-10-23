#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <winhttp.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define CLI_VERSION "1.0.0"
#define PRIMARY_HOST L"livenotes.vercel.app"
#define FALLBACK_HOST L"livenotes-b31fe-default-rtdb.asia-southeast1.firebasedatabase.app"

void print_help(const char *prog_name) {
    printf("\n");
    printf("  LiveNotes CLI - Instant Room Text Extractor (v%s)\n", CLI_VERSION);
    printf("  --------------------------------------------------\n");
    printf("  USAGE:\n");
    printf("    livenotes -r <room_name>\n");
    printf("    livenotes -r <room_name> -o <output_filename>\n");
    printf("    livenotes <room_name>\n\n");
    printf("  OPTIONS:\n");
    printf("    -r, --room <room_name>     Room name or code to extract\n");
    printf("    -o, --output <filename>    Custom output file path (default: <room_name>.txt)\n");
    printf("    -v, --version              Display CLI version\n");
    printf("    -h, --help                 Display this help message\n\n");
    printf("  EXAMPLES:\n");
    printf("    livenotes -r 291026\n");
    printf("    livenotes -r 291026 -o notes.txt\n");
    printf("    livenotes 291026\n\n");
}

/* Helper to convert UTF-8 char* to wchar_t* */
wchar_t* to_wide(const char* str) {
    int len = MultiByteToWideChar(CP_UTF8, 0, str, -1, NULL, 0);
    if (len <= 0) return NULL;
    wchar_t *wstr = (wchar_t*)malloc(len * sizeof(wchar_t));
    if (!wstr) return NULL;
    MultiByteToWideChar(CP_UTF8, 0, str, -1, wstr, len);
    return wstr;
}

/* Perform HTTPS GET request using WinHTTP */
char* http_get(HINTERNET hSession, const wchar_t *host, const wchar_t *path, DWORD *out_status, DWORD *out_size) {
    *out_status = 0;
    *out_size = 0;

    HINTERNET hConnect = WinHttpConnect(hSession, host, INTERNET_DEFAULT_HTTPS_PORT, 0);
    if (!hConnect) return NULL;

    HINTERNET hRequest = WinHttpOpenRequest(
        hConnect,
        L"GET",
        path,
        NULL,
        WINHTTP_NO_REFERER,
        WINHTTP_DEFAULT_ACCEPT_TYPES,
        WINHTTP_FLAG_SECURE
    );

    if (!hRequest) {
        WinHttpCloseHandle(hConnect);
        return NULL;
    }

    /* Set timeouts: resolve 10s, connect 10s, send 10s, receive 15s */
    WinHttpSetTimeouts(hRequest, 10000, 10000, 10000, 15000);

    BOOL bResults = WinHttpSendRequest(
        hRequest,
        WINHTTP_NO_ADDITIONAL_HEADERS,
        0,
        WINHTTP_NO_REQUEST_DATA,
        0,
        0,
        0
    );

    if (bResults) {
        bResults = WinHttpReceiveResponse(hRequest, NULL);
    }

    if (!bResults) {
        WinHttpCloseHandle(hRequest);
        WinHttpCloseHandle(hConnect);
        return NULL;
    }

    DWORD status_code = 0;
    DWORD status_size = sizeof(status_code);
    WinHttpQueryHeaders(
        hRequest,
        WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER,
        WINHTTP_HEADER_NAME_BY_INDEX,
        &status_code,
        &status_size,
        WINHTTP_NO_HEADER_INDEX
    );
    *out_status = status_code;

    /* Read response body */
    size_t capacity = 4096;
    size_t total_bytes = 0;
    char *buffer = (char*)malloc(capacity);
    if (!buffer) {
        WinHttpCloseHandle(hRequest);
        WinHttpCloseHandle(hConnect);
        return NULL;
    }

    DWORD bytes_read = 0;
    DWORD bytes_available = 0;

    while (WinHttpQueryDataAvailable(hRequest, &bytes_available) && bytes_available > 0) {
        if (total_bytes + bytes_available + 1 > capacity) {
            while (total_bytes + bytes_available + 1 > capacity) {
                capacity *= 2;
            }
            char *new_buf = (char*)realloc(buffer, capacity);
            if (!new_buf) {
                free(buffer);
                WinHttpCloseHandle(hRequest);
                WinHttpCloseHandle(hConnect);
                return NULL;
            }
            buffer = new_buf;
        }

        if (!WinHttpReadData(hRequest, buffer + total_bytes, bytes_available, &bytes_read)) {
            break;
        }
        total_bytes += bytes_read;
    }

    buffer[total_bytes] = '\0';
    *out_size = (DWORD)total_bytes;

    WinHttpCloseHandle(hRequest);
    WinHttpCloseHandle(hConnect);
    return buffer;
}

/* Decode JSON-encoded string from Firebase REST response */
char* decode_json_string(const char *json, size_t in_len, size_t *out_len) {
    if (!json || in_len == 0) return NULL;

    /* Skip leading whitespace */
    size_t start = 0;
    while (start < in_len && (json[start] == ' ' || json[start] == '\t' || json[start] == '\r' || json[start] == '\n')) {
        start++;
    }

    if (start >= in_len) return NULL;

    /* Check for JSON null */
    if (in_len - start >= 4 && strncmp(json + start, "null", 4) == 0) {
        return NULL;
    }

    if (json[start] != '"') {
        /* Not a quoted string, return as-is */
        char *res = (char*)malloc(in_len + 1);
        if (!res) return NULL;
        memcpy(res, json, in_len);
        res[in_len] = '\0';
        *out_len = in_len;
        return res;
    }

    /* Quoted JSON string */
    start++; /* skip open quote */
    char *out = (char*)malloc(in_len + 1);
    if (!out) return NULL;

    size_t o = 0;
    for (size_t i = start; i < in_len; i++) {
        if (json[i] == '"' && i + 1 >= in_len) {
            break; /* closing quote */
        }
        if (json[i] == '\\' && i + 1 < in_len) {
            i++;
            switch (json[i]) {
                case 'n': out[o++] = '\n'; break;
                case 'r': out[o++] = '\r'; break;
                case 't': out[o++] = '\t'; break;
                case 'b': out[o++] = '\b'; break;
                case 'f': out[o++] = '\f'; break;
                case '"': out[o++] = '"'; break;
                case '\\': out[o++] = '\\'; break;
                case '/': out[o++] = '/'; break;
                case 'u': {
                    /* Unicode \uXXXX hex */
                    if (i + 4 < in_len) {
                        char hex[5] = { json[i+1], json[i+2], json[i+3], json[i+4], 0 };
                        unsigned int codepoint = (unsigned int)strtoul(hex, NULL, 16);
                        i += 4;
                        /* Encode codepoint to UTF-8 */
                        if (codepoint <= 0x7F) {
                            out[o++] = (char)codepoint;
                        } else if (codepoint <= 0x7FF) {
                            out[o++] = (char)(0xC0 | ((codepoint >> 6) & 0x1F));
                            out[o++] = (char)(0x80 | (codepoint & 0x3F));
                        } else {
                            out[o++] = (char)(0xE0 | ((codepoint >> 12) & 0x0F));
                            out[o++] = (char)(0x80 | ((codepoint >> 6) & 0x3F));
                            out[o++] = (char)(0x80 | (codepoint & 0x3F));
                        }
                    }
                    break;
                }
                default:
                    out[o++] = json[i];
                    break;
            }
        } else {
            out[o++] = json[i];
        }
    }

    out[o] = '\0';
    *out_len = o;
    return out;
}

int main(int argc, char *argv[]) {
    const char *room = NULL;
    const char *outfile = NULL;

    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "-h") == 0 || strcmp(argv[i], "--help") == 0) {
            print_help(argv[0]);
            return 0;
        }
        if (strcmp(argv[i], "-v") == 0 || strcmp(argv[i], "--version") == 0) {
            printf("livenotes %s\n", CLI_VERSION);
            return 0;
        }
        if (strcmp(argv[i], "-r") == 0 || strcmp(argv[i], "--room") == 0) {
            if (i + 1 < argc) {
                room = argv[++i];
            } else {
                fprintf(stderr, "[LiveNotes] Error: Flag %s requires a room name.\n", argv[i]);
                return 1;
            }
            continue;
        }
        if (strcmp(argv[i], "-o") == 0 || strcmp(argv[i], "--output") == 0) {
            if (i + 1 < argc) {
                outfile = argv[++i];
            } else {
                fprintf(stderr, "[LiveNotes] Error: Flag %s requires a file path.\n", argv[i]);
                return 1;
            }
            continue;
        }
        if (argv[i][0] != '-' && room == NULL) {
            room = argv[i];
            continue;
        }
        fprintf(stderr, "[LiveNotes] Error: Unknown argument '%s'\n", argv[i]);
        fprintf(stderr, "Run 'livenotes --help' for usage.\n");
        return 1;
    }

    if (!room || strlen(room) == 0) {
        fprintf(stderr, "[LiveNotes] Error: Missing room name.\n");
        fprintf(stderr, "Usage: livenotes -r <room_name>\n");
        return 1;
    }

    /* Default output filename: <room_name>.txt */
    char default_out[512];
    if (!outfile) {
        snprintf(default_out, sizeof(default_out), "%s.txt", room);
        outfile = default_out;
    }

    printf("[LiveNotes] Extracting text from room: %s ...\n", room);

    HINTERNET hSession = WinHttpOpen(
        L"LiveNotes-CLI/" CLI_VERSION,
        WINHTTP_ACCESS_TYPE_DEFAULT_PROXY,
        WINHTTP_NO_PROXY_NAME,
        WINHTTP_NO_PROXY_BYPASS,
        0
    );

    if (!hSession) {
        fprintf(stderr, "[LiveNotes] Error: Could not initialize Windows HTTP subsystem.\n");
        return 1;
    }

    /* 1. Try Primary endpoint: https://livenotes.vercel.app/raw/<room> */
    wchar_t primary_path[512];
    wchar_t *wroom = to_wide(room);
    if (!wroom) {
        WinHttpCloseHandle(hSession);
        fprintf(stderr, "[LiveNotes] Error: Invalid room name encoding.\n");
        return 1;
    }
    swprintf(primary_path, 512, L"/raw/%ls", wroom);

    DWORD status = 0;
    DWORD data_len = 0;
    char *data = http_get(hSession, PRIMARY_HOST, primary_path, &status, &data_len);

    /* If primary succeeded with 200 */
    if (data && status == 200 && data_len > 0) {
        FILE *f = fopen(outfile, "wb");
        if (!f) {
            fprintf(stderr, "[LiveNotes] Error: Could not open output file '%s' for writing.\n", outfile);
            free(data);
            free(wroom);
            WinHttpCloseHandle(hSession);
            return 1;
        }
        fwrite(data, 1, data_len, f);
        fclose(f);
        free(data);
        free(wroom);
        WinHttpCloseHandle(hSession);
        printf("[LiveNotes] Successfully saved text to: %s\n", outfile);
        return 0;
    }

    if (data) {
        free(data);
        data = NULL;
    }

    /* 2. Fallback to Firebase Realtime Database */
    wchar_t fallback_path[512];
    swprintf(fallback_path, 512, L"/rooms/%ls/notes.json", wroom);
    free(wroom);

    data = http_get(hSession, FALLBACK_HOST, fallback_path, &status, &data_len);
    WinHttpCloseHandle(hSession);

    if (!data || status != 200) {
        if (data) free(data);
        fprintf(stderr, "[LiveNotes] Error: Could not connect to LiveNotes. Check room name or internet connection.\n");
        return 1;
    }

    size_t decoded_len = 0;
    char *decoded = decode_json_string(data, data_len, &decoded_len);
    free(data);

    if (!decoded || decoded_len == 0) {
        if (decoded) free(decoded);
        fprintf(stderr, "[LiveNotes] Error: Room \"%s\" was not found or has no text content.\n", room);
        return 1;
    }

    FILE *f = fopen(outfile, "wb");
    if (!f) {
        fprintf(stderr, "[LiveNotes] Error: Could not open output file '%s' for writing.\n", outfile);
        free(decoded);
        return 1;
    }
    fwrite(decoded, 1, decoded_len, f);
    fclose(f);
    free(decoded);

    printf("[LiveNotes] Successfully saved text to: %s\n", outfile);
    return 0;
}
