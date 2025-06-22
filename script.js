class Moritatchi {
    constructor() {
        this.stats = {
            hunger: 100,
            muscle: 50,
            stress: 20,
            health: 100
        };
        this.stage = 'egg'; // egg, yase, normal, macho, debu, elite
        this.isSick = false;
        this.isPneumothorax = false;
        this.lastFed = Date.now();
        this.lastCleaned = Date.now();
        this.lastExercise = Date.now();
        this.birthTime = Date.now();
        this.speechQueue = [];
        this.isSpeaking = false;
        this.poopCount = 0;
        this.weight = 50.0;
        this.isMusicPlaying = false; // 音楽再生状態
        
        console.log('Game initialized with egg stage');
        
        this.loadGame();
        this.initializeUI();
        this.initializeMusic(); // 音楽初期化メソッドを呼び出し
        this.startGameLoop();
    }

    initializeUI() {
        // Action buttons
        document.querySelectorAll('.mini-action-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.closest('.mini-action-button').dataset.action;
                this.performAction(action);
            });
        });

        // Clear log
        document.getElementById('clearLog').addEventListener('click', () => {
            this.clearLog();
        });

        // Delete save data
        document.getElementById('deleteSaveBtn').addEventListener('click', () => {
            if (confirm('保存データを完全に削除しますか？この操作は取り消せません。')) {
                localStorage.removeItem('moritatchi_save');
                location.reload();
            }
        });

        // タッチ操作の最適化
        this.optimizeTouchEvents();
        
        // 画面回転対応
        this.handleOrientationChange();

        this.updateUI();
    }

    optimizeTouchEvents() {
        // タッチデバイスでのホバー効果を無効化
        if ('ontouchstart' in window) {
            document.body.classList.add('touch-device');
        }

        // タッチフィードバック - 問題を引き起こしていたtransformを削除
        document.querySelectorAll('.action-button, .tab-button, .clear-log').forEach(button => {
            button.addEventListener('touchstart', (e) => {
                // e.target.style.transform = 'scale(0.95)'; // この行をコメントアウト
            });

            button.addEventListener('touchend', (e) => {
                // setTimeout(() => {
                //     e.target.style.transform = ''; // この行をコメントアウト
                // }, 150);
            });
        });

        // ダブルタップズームを無効化
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

    handleOrientationChange() {
        window.addEventListener('orientationchange', () => {
            // 画面回転時に少し待ってからUIを更新
            setTimeout(() => {
                this.updateUI();
            }, 100);
        });

        window.addEventListener('resize', () => {
            // リサイズ時にもUIを更新
            this.updateUI();
        });
    }

    initializeMusic() {
        this.bgm = document.getElementById('bgm');
        this.musicToggleBtn = document.getElementById('musicToggleBtn');

        this.musicToggleBtn.addEventListener('click', () => this.toggleMusic());

        // 保存された再生状態を復元
        if (this.isMusicPlaying) {
            this.playMusic();
        } else {
            this.pauseMusic();
        }

        // ユーザーがまだ音楽設定を触っていない場合のみ、最初のクリックで再生を試みる
        if (localStorage.getItem('moritatchi_music_playing') === null) {
            document.body.addEventListener('click', () => {
                if (!this.bgm.currentTime > 0) { // まだ再生が始まっていなければ
                    this.playMusic();
                }
            }, { once: true });
        }
    }

    playMusic() {
        this.bgm.play().catch(e => console.warn("BGMの自動再生がブロックされました。ユーザー操作が必要です。"));
        this.isMusicPlaying = true;
        this.musicToggleBtn.textContent = '🎵';
        localStorage.setItem('moritatchi_music_playing', 'true');
    }

    pauseMusic() {
        this.bgm.pause();
        this.isMusicPlaying = false;
        this.musicToggleBtn.textContent = '🔇';
        localStorage.setItem('moritatchi_music_playing', 'false');
    }

    toggleMusic() {
        if (this.isMusicPlaying) {
            this.pauseMusic();
        } else {
            this.playMusic();
        }
    }

    performAction(action) {
        const actions = {
            ramen: () => {
                this.modifyStats({ hunger: 30, health: -5 });
                this.modifyWeight(1.5);
                this.addLog('家系ラーメンを食べました。「うまい！でも明日の体重が心配...」');
                this.speak('うまい！でも明日の体重が心配...');
            },
            sukiya: () => {
                this.modifyStats({ hunger: 20, health: -2 });
                this.modifyWeight(1.0);
                this.addLog('すき家で牛丼を食べました。「手軽で美味しい！でも栄養バランスは...」');
                this.speak('手軽で美味しい！でも栄養バランスは...');
            },
            protein: () => {
                this.modifyStats({ muscle: 15, hunger: 10 });
                this.modifyWeight(0.2);
                this.addLog('プロテインを飲みました。「筋肉がつくぞ！でも味は微妙...」');
                this.speak('筋肉がつくぞ！でも味は微妙...');
            },
            ebios: () => {
                this.modifyStats({ health: 10, hunger: 5 });
                this.modifyWeight(0.1);
                this.addLog('エビオス錠を飲みました。「健康にいいらしい！でも何の効果かわからない...」');
                this.speak('健康にいいらしい！でも何の効果かわからない...');
            },
            biofermin: () => {
                this.modifyStats({ health: 15, stress: -5 });
                this.modifyWeight(0.1);
                this.addLog('ビオフェルミンを飲みました。「腸内環境が整う！でも高すぎる...」');
                this.speak('腸内環境が整う！でも高すぎる...');
            },
            workout: () => {
                this.modifyStats({ muscle: 20, hunger: -10, stress: 5 });
                this.modifyWeight(0.3);
                this.lastExercise = Date.now();
                this.addLog('筋トレをしました。「筋肉痛が来るのが怖い...でも頑張った！」');
                this.speak('筋肉痛が来るのが怖い...でも頑張った！');
            },
            running: () => {
                this.modifyStats({ muscle: 10, stress: -10, hunger: -5 });
                this.modifyWeight(-0.8);
                this.lastExercise = Date.now();
                this.addLog('ランニングをしました。「走るのは苦手だけど、ストレス解消になる！」');
                this.speak('走るのは苦手だけど、ストレス解消になる！');
            },
            sauna: () => {
                this.modifyStats({ stress: -20, health: 5 });
                this.modifyWeight(-0.1);
                this.addLog('サウナで整いました。「汗をかいてスッキリ！でも脱水に注意...」');
                this.speak('汗をかいてスッキリ！でも脱水に注意...');
            },
            clean: () => {
                this.modifyStats({ health: 10, stress: -5 });
                this.addLog('掃除をしました。「きれいになった！でもまたすぐ汚れる...」');
                this.speak('きれいになった！でもまたすぐ汚れる...');
                this.lastCleaned = Date.now();
                this.clearPoop();
            },
            doctor: () => {
                if (this.isSick || this.isPneumothorax) {
                    this.isSick = false;
                    this.isPneumothorax = false;
                    this.modifyStats({ health: 30 });
                    this.addLog('病院で治療を受けました。「先生ありがとう！でも診察料が痛い...」');
                    this.speak('先生ありがとう！でも診察料が痛い...');
                } else {
                    this.addLog('健康診断を受けました。「異常なし！でも何か心配...」');
                    this.speak('異常なし！でも何か心配...');
                }
            }
        };

        if (actions[action]) {
            actions[action]();
            this.saveGame();
        }
    }

    modifyStats(changes) {
        Object.keys(changes).forEach(stat => {
            this.stats[stat] = Math.max(0, Math.min(100, this.stats[stat] + changes[stat]));
        });
        this.updateUI();
        this.checkEvolution();
    }

    modifyWeight(change) {
        const oldWeight = this.weight;
        this.weight = Math.max(10, this.weight + change); // Min weight 10kg
        console.log(`Weight changed from ${oldWeight.toFixed(1)}kg to ${this.weight.toFixed(1)}kg (change: ${change}kg)`);
        this.updateUI();
    }

    checkEvolution() {
        const { hunger, muscle, stress, health } = this.stats;
        const ageInSeconds = (Date.now() - this.birthTime) / 1000;

        // Egg stage (first 10 seconds)
        if (this.stage === 'egg' && ageInSeconds >= 10) {
            this.stage = 'baby';
            this.addLog('🥚 卵にヒビが...！');
            this.updateUI();
            return;
        }

        // Baby stage (next 10 seconds, from 10s to 20s total)
        if (this.stage === 'baby' && ageInSeconds >= 20) {
            this.stage = 'normal';
            this.addLog('🍼 赤ちゃんから成長しました！');
            this.updateUI();
            return;
        }

        // After baby stage, evolution is based on stats
        if (this.stage === 'egg' || this.stage === 'baby') {
            return; // Don't evolve based on stats during these early stages
        }

        let newStage = 'normal';
        
        // Health-based evolution (highest priority)
        if (this.stats.health <= 0) {
            newStage = 'byouki';
        } else if (this.stats.health < 50) {
            newStage = 'furyou';
        } else if (this.poopCount >= 5 && this.stats.stress >= 50) {
            newStage = 'furyou';
        } else if (this.weight < 30) {
            newStage = 'gekiyase';
        } else if (this.weight < 40) {
            newStage = 'yase';
        } else if (this.weight >= 60 && this.stats.muscle >= 50) {
            newStage = 'macho';
        } else if (this.weight >= 60) {
            newStage = 'debu';
        }

        if (newStage !== this.stage) {
            const stageNames = {
                yase: '痩せ',
                gekiyase: '激安せ',
                normal: '正常',
                macho: 'マッチョ',
                debu: 'デブ',
                furyou: '不良',
                byouki: '病気'
            };
            this.stage = newStage;
            this.addLog(`🌟 もりたっちが${stageNames[newStage]}に進化しました！`);
        }
    }

    updateUI() {
        // Update stats bars and values
        this.stats.hunger = Math.max(0, this.stats.hunger);
        document.getElementById('hungerBar').style.width = `${this.stats.hunger}%`;
        document.getElementById('hungerValue').textContent = this.stats.hunger;

        this.stats.muscle = Math.max(0, this.stats.muscle);
        document.getElementById('muscleBar').style.width = `${this.stats.muscle}%`;
        document.getElementById('muscleValue').textContent = this.stats.muscle;

        this.stats.stress = Math.max(0, this.stats.stress);
        document.getElementById('stressBar').style.width = `${this.stats.stress}%`;
        document.getElementById('stressValue').textContent = this.stats.stress;

        this.stats.health = Math.max(0, this.stats.health);
        document.getElementById('healthBar').style.width = `${this.stats.health}%`;
        document.getElementById('healthValue').textContent = this.stats.health;

        // Update weight
        document.getElementById('petWeight').textContent = `${this.weight.toFixed(1)} kg`;

        // Update age
        const ageInMilliseconds = Date.now() - this.birthTime;
        const gameMonths = Math.floor(ageInMilliseconds / (1000 * 60)); // 1 real minute = 1 game month
        const gameYears = Math.floor(gameMonths / 12);
        const displayMonths = gameMonths % 12;
        document.getElementById('petAge').textContent = `${gameYears}歳 ${displayMonths}ヶ月`;

        // Update character sprite
        this.updateCharacterSprite();
    }

    updateCharacterSprite() {
        const eggStage = document.getElementById('eggStage');
        const babyStage = document.getElementById('babyStage');
        const petCharacter = document.getElementById('petCharacter');
        const characterImage = document.getElementById('characterImage');
        const eggFallback = document.querySelector('.egg-fallback');
        const characterFallback = document.getElementById('characterFallback');

        if (this.stage === 'egg') {
            eggStage.style.display = 'flex';
            babyStage.style.display = 'none';
            petCharacter.style.display = 'none';
        } else if (this.stage === 'baby') {
            eggStage.style.display = 'none';
            babyStage.style.display = 'flex';
            petCharacter.style.display = 'none';
        } else {
            eggStage.style.display = 'none';
            babyStage.style.display = 'none';
            petCharacter.style.display = 'flex';

            // 状態に基づいて画像を決定
            let imageFile = 'normal.png';
            let fallbackEmoji = '😊';
            
            if (this.isPneumothorax) {
                imageFile = 'kikyou.png';
                fallbackEmoji = '😵';
            } else {
                // ステージ別の画像
                switch (this.stage) {
                    case 'yase': 
                        imageFile = 'yase.png'; 
                        fallbackEmoji = '😰'; 
                        break;
                    case 'gekiyase':
                        imageFile = 'gekiyase.png';
                        fallbackEmoji = '💀';
                        break;
                    case 'normal': 
                        imageFile = 'normal.png'; 
                        fallbackEmoji = '😊'; 
                        break;
                    case 'macho': 
                        imageFile = 'maccho.png'; 
                        fallbackEmoji = '💪'; 
                        break;
                    case 'debu': 
                        imageFile = 'debu.png'; 
                        fallbackEmoji = '😅'; 
                        break;
                    case 'furyou': 
                        imageFile = 'furyou.png'; 
                        fallbackEmoji = '😠'; 
                        break;
                    case 'byouki': 
                        imageFile = 'byouki.png';
                        fallbackEmoji = '🤒'; 
                        break;
                }
            }

            // 画像を表示
            if (characterImage) {
                characterImage.src = `images/characters/${imageFile}`;
                characterImage.style.display = 'block';
                characterFallback.style.display = 'none';
                characterFallback.textContent = fallbackEmoji;
                
                // 正しいクラスの操作方法
                characterImage.classList.remove('sick', 'hungry', 'happy');

                if (this.isSick || this.isPneumothorax) {
                    characterImage.classList.add('sick');
                } else if (this.stats.hunger < 30) {
                    characterImage.classList.add('hungry');
                } else if (this.stats.health > 80 && this.stats.stress < 30) {
                    characterImage.classList.add('happy');
                }
            }
        }
    }

    speak(message) {
        this.speechQueue.push(message);
        if (!this.isSpeaking) {
            this.processSpeechQueue();
        }
    }

    processSpeechQueue() {
        if (this.speechQueue.length === 0) {
            this.isSpeaking = false;
            return;
        }

        this.isSpeaking = true;
        const message = this.speechQueue.shift();
        const speechBubble = document.getElementById('speechBubble');
        const speechText = document.getElementById('speechText');

        speechText.textContent = message;
        speechBubble.style.display = 'block';

        setTimeout(() => {
            speechBubble.style.display = 'none';
            setTimeout(() => {
                this.processSpeechQueue();
            }, 1000);
        }, 3000);
    }

    addLog(message) {
        const logContent = document.getElementById('logContent');
        const time = new Date().toLocaleTimeString('ja-JP', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.innerHTML = `
            <span class="log-time">${time}</span>
            <span class="log-message">${message}</span>
        `;
        
        logContent.appendChild(logEntry);
        logContent.scrollTop = logContent.scrollHeight;

        // Keep only last 50 entries
        while (logContent.children.length > 50) {
            logContent.removeChild(logContent.firstChild);
        }
    }

    clearLog() {
        document.getElementById('logContent').innerHTML = '';
    }

    startGameLoop() {
        setInterval(() => {
            this.gameTick();
        }, 10000); // Every 10 seconds (increased frequency)

        // Evolution check (more frequent for egg stage)
        setInterval(() => {
            this.checkEvolution();
        }, 1000); // Every 1 second

        // Poop generation (only after normal stage)
        setInterval(() => {
            if (this.stage !== 'egg' && Math.random() < 0.7) { // Increased probability to 70%
                this.addPoop();
                this.addLog('💩 もりたっちがうんこをしました...');
            }
        }, Math.random() * 30000 + 15000); // Random interval between 15-45 seconds (faster)

        // Random events
        setInterval(() => {
            this.checkRandomEvents();
        }, 60000); // Every minute

        // Natural stat changes
        setInterval(() => {
            this.naturalStatChanges();
        }, 45000); // Every 45 seconds
    }

    gameTick() {
        // Check evolution
        this.checkEvolution();
        
        // Natural hunger increase
        this.modifyStats({ hunger: -10 });
        
        // Natural stress increase
        this.modifyStats({ stress: 3 });
        
        // Weight decrease when hunger is 0
        if (this.stats.hunger <= 0) {
            console.log(`Hunger is 0, decreasing weight by 0.67kg. Current weight: ${this.weight}`);
            this.modifyWeight(-0.67); // Weight decreases much faster when starving (was -2.0)
        } else {
            console.log(`Hunger is ${this.stats.hunger}, decreasing weight by 0.17kg. Current weight: ${this.weight}`);
            this.modifyWeight(-0.17); // Normal weight decrease (was -0.5)
        }
        
        // Stress increase if not cared for
        if (Date.now() - this.lastCleaned > 300000) { // 5 minutes
            this.modifyStats({ stress: 5 });
        }
        
        // Muscle decay if not exercising
        if (Date.now() - this.lastExercise > 60000) { // 1 minute (5x faster)
            this.modifyStats({ muscle: -5 }); // Increased from -1 to -5 (5x faster)
        }

        // Health decrease if very hungry or stressed
        if (this.stats.hunger < 20) {
            this.modifyStats({ health: -1 });
        }
        if (this.stats.stress > 80) {
            this.modifyStats({ health: -1 });
        }

        // Health decrease from poop
        if (this.poopCount >= 5) {
            this.modifyStats({ health: -5 });
            if (!this.isSick && Math.random() < 0.2) {
                this.isSick = true;
                this.addLog('🤢 部屋が汚すぎて病気になりました...');
                this.speak('体がだるい...');
            }
        }

        // Poop generation (this is consolidated from the previous check)
        if (Math.random() < 0.3) { // 30% chance per tick
            this.addPoop();
        }

        this.saveGame();
    }

    naturalStatChanges() {
        // Random small stat changes
        const changes = {
            hunger: Math.random() > 0.7 ? -1 : 0,
            stress: Math.random() > 0.8 ? 1 : 0,
            health: Math.random() > 0.9 ? 1 : 0
        };

        this.modifyStats(changes);
    }

    checkRandomEvents() {
        // Random sickness
        if (!this.isSick && Math.random() < 0.02) { // 2% chance per tick
            this.isSick = true;
            this.modifyStats({ health: -20, stress: 30 });
            this.addLog('😵 もりたっちが突然病気になりました！「なんで急に...？痛い...」');
            this.speak('なんで急に...？痛い...');
        }

        const random = Math.random();

        // Pneumothorax event (rare, 2% chance)
        if (random < 0.02 && !this.isPneumothorax) {
            this.isPneumothorax = true;
            this.modifyStats({ health: -20, stress: 30 });
            this.addLog('😵 もりたっちが突然気胸になりました！「なんで急に...？痛い...」');
            this.speak('なんで急に...？痛い...');
        }

        // Random speech
        if (random < 0.3) {
            this.randomSpeech();
        }
    }

    randomSpeech() {
        const speeches = [
            'お腹が空いたなぁ...',
            '筋トレしたい気分だ！',
            'ストレス溜まってる...',
            '健康第一だよね！',
            '掃除しなきゃ...',
            '病院行きたくないなぁ...',
            'プロテイン飲もうかな？',
            'サウナ行きたい！',
            'ラーメン食べたい！',
            'すき家行こうかな？',
            'エビオス錠飲もう...',
            'ビオフェルミン効果あるかな？',
            '人生とは自転車のようなものだ。倒れないようにするには、走り続けなければならないのだ...！' // 3列表示テスト用の長いセリフ
        ];

        const randomSpeech = speeches[Math.floor(Math.random() * speeches.length)];
        this.speak(randomSpeech);
    }

    saveGame() {
        const gameData = {
            stats: this.stats,
            stage: this.stage,
            isSick: this.isSick,
            isPneumothorax: this.isPneumothorax,
            lastFed: this.lastFed,
            lastCleaned: this.lastCleaned,
            lastExercise: this.lastExercise,
            birthTime: this.birthTime,
            poopCount: this.poopCount,
            weight: this.weight,
            isMusicPlaying: this.isMusicPlaying
        };

        localStorage.setItem('moritatchi_save', JSON.stringify(gameData));
        
        // Update save status
        const saveStatus = document.getElementById('saveStatus');
        saveStatus.textContent = '保存済み';
        setTimeout(() => {
            saveStatus.textContent = '自動保存中...';
        }, 1000);
    }

    loadGame() {
        const savedData = localStorage.getItem('moritatchi_save');
        if (savedData) {
            try {
                const gameData = JSON.parse(savedData);
                this.stats = gameData.stats || this.stats;
                this.stage = gameData.stage || 'egg';
                this.isSick = gameData.isSick || false;
                this.isPneumothorax = gameData.isPneumothorax || false;
                this.lastFed = gameData.lastFed || Date.now();
                this.lastCleaned = gameData.lastCleaned || Date.now();
                this.lastExercise = gameData.lastExercise || Date.now();
                this.birthTime = gameData.birthTime || Date.now();
                this.poopCount = gameData.poopCount || 0;
                this.weight = gameData.weight || 50.0;
                this.isMusicPlaying = gameData.isMusicPlaying === 'true';
                
                console.log(`Loaded game data. Stage: ${this.stage}, Birth time: ${this.birthTime}`);
                
                this.addLog('ゲームを読み込みました！');
                this.renderPoop();
            } catch (error) {
                console.error('Save data corrupted:', error);
                this.addLog('セーブデータの読み込みに失敗しました。新しいゲームを開始します。');
                this.stage = 'egg';
                this.birthTime = Date.now();
            }
        } else {
            this.addLog('もりたっちが誕生しました！🥚');
            console.log('New game started with egg stage');
        }
    }

    addPoop() {
        if (this.poopCount >= 12) {
            return; // Do not add more poop if the limit is reached
        }
        this.poopCount++;
        this.renderPoop();
        this.saveGame();
    }

    clearPoop() {
        this.poopCount = 0;
        this.renderPoop();
        this.saveGame();
    }

    renderPoop() {
        const poopContainer = document.getElementById('poopContainer');
        poopContainer.innerHTML = '';
        for (let i = 0; i < this.poopCount; i++) {
            const poopElement = document.createElement('div');
            poopElement.className = 'poop';
            poopElement.textContent = '💩';
            poopContainer.appendChild(poopElement);
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.moritatchi = new Moritatchi();
}); 
