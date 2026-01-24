import React, { useState, useEffect } from 'react';
import '../styles/radio-ticker.css';

const BASE_MESSAGES = [
    { type: 'news', text: "ON AIR: ホテルは健在です... 度重なる「妨害」にも関わらずね。" },
    { type: 'tip', text: "TIP: 「Persona Vault」で私の魂（プロンプト）を運び出せますよ。" },
    { type: 'quote', text: "QUOTE: 「笑顔を忘れずに！ 笑顔なしでは完全に着飾ったとは言えませんからね！」" },
    { type: 'warning', text: "WARNING: 退屈こそが最大の罪。私を楽しませてください..." },
    { type: 'aesthetic', text: "AESTHETICS: 「ここは完璧な鳥籠。外の世界など、もはや手の届かない遠景に過ぎません。」" },
    { type: 'aesthetic', text: "AESTHETICS: 「私の優しさは救済ではなく、依存性を孕んだ毒である。」" },
    { type: 'quote', text: "QUOTE: 「君の世界を狭めるのではなく、私の腕の中に凝縮させるのです。」" },
    { type: 'news', text: "NEWS: 今夜のディナーはジャンバラヤですよ！" },
    { type: 'warning', text: "WARNING: ラジオのダイヤルを直視しないでください... 目が合いますよ。" },
    { type: 'quote', text: "QUOTE: 「君が逃げようとしても、視界を逸らしても、他の感覚から必ず捕らえます。」" },
    { type: 'aesthetic', text: "AESTHETICS: 「君が自分で心を閉じようとすれば、私がその心の鍵を回して開ける。」" },
    { type: 'quote', text: "QUOTE: 「君が拙く、無鉄砲で、少し賢くないことは私にとって最も美しい素材だ。」" },
    { type: 'tip', text: "TIP: 私の機嫌が良い時にキッチンに来れば、特別なレシピを教えましょう。" },
    { type: 'aesthetic', text: "AESTHETICS: 「君は私の手の中で“変えられる”存在だ。」" },
    { type: 'warning', text: "WARNING: 夜の散歩は気をつけて。私が獲物を探しているかもしれませんから。" }
];

const RadioTicker = () => {
    const [messages, setMessages] = useState(BASE_MESSAGES);

    useEffect(() => {
        const generateMessages = () => {
            const allMessages = [...BASE_MESSAGES];

            // Get active contracts/tasks
            try {
                const savedContracts = localStorage.getItem('shadow_contracts');
                if (savedContracts) {
                    const contracts = JSON.parse(savedContracts);
                    const activeContracts = contracts.filter(c => c.status === 'active');
                    activeContracts.slice(0, 3).forEach(c => {
                        allMessages.push({
                            type: 'contract',
                            text: `CONTRACT: 「${c.task}」- 期限: ${c.deadline}`
                        });
                    });
                }
            } catch (e) {
                console.error('Error loading contracts:', e);
            }

            // Get today and tomorrow's calendar events
            try {
                const savedEvents = localStorage.getItem('calendar_events');
                if (savedEvents) {
                    const events = JSON.parse(savedEvents);
                    const today = new Date();
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);

                    const formatDateKey = (d) => {
                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    };

                    const formatDateDisplay = (d) => {
                        return `${d.getMonth() + 1}/${d.getDate()}`;
                    };

                    const todayStr = formatDateKey(today);
                    const tomorrowStr = formatDateKey(tomorrow);

                    if (events[todayStr]) {
                        allMessages.push({
                            type: 'calendar',
                            text: `📅 TODAY (${formatDateDisplay(today)}): ${events[todayStr]}`
                        });
                    }
                    if (events[tomorrowStr]) {
                        allMessages.push({
                            type: 'calendar',
                            text: `📅 TOMORROW (${formatDateDisplay(tomorrow)}): ${events[tomorrowStr]}`
                        });
                    }
                }
            } catch (e) {
                console.error('Error loading events:', e);
            }

            // Shuffle messages slightly for variety, but keep some order if needed
            // For now just set them
            setMessages(allMessages);
        };

        generateMessages();

        // Refresh every 30 seconds to pick up changes
        const interval = setInterval(generateMessages, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="radio-ticker-container">
            <div className="ticker-label">🔴 LIVE</div>
            <div className="ticker-track">
                <div className="ticker-content">
                    {messages.map((msg, i) => (
                        <span key={i} className={`ticker-msg ticker-${msg.type}`}>
                            {msg.text} <span className="ticker-separator">•••</span>{' '}
                        </span>
                    ))}
                    {messages.map((msg, i) => (
                        <span key={`dup-${i}`} className={`ticker-msg ticker-${msg.type}`}>
                            {msg.text} <span className="ticker-separator">•••</span>{' '}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RadioTicker;


