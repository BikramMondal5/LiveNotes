const fs = require('fs');
let c = fs.readFileSync('app/room/[roomId]/page.tsx', 'utf8');

c = c.replace(/import \{ ConfettiButton \} from "\@\/components\/ui\/confetti\";/, 'import confetti from "canvas-confetti";');

while (c.includes('<ConfettiButton')) {
    c = c.replace(/<ConfettiButton([\s\S]*?)<\/ConfettiButton>/, function(match, p1) {
        let inside = p1.replace(/options=\{\{[\s\S]*?\}\}/, '');
        let newBtn = '<button' + inside + '</button>';
        return newBtn.replace('setIsCopied(true);', "setIsCopied(true); confetti({ particleCount: 250, spread: 120, angle: -90, startVelocity: 45, origin: { x: 0.5, y: -0.1 }, colors: ['#2EFF85', '#FFFFFF', '#10B981'] });");
    });
}

fs.writeFileSync('app/room/[roomId]/page.tsx', c, 'utf8');
