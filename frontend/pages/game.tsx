import React, { useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';

interface Round {
  id: string;
  roundNumber: number;
  status: string;
  predictionTaiProb: number;
  predictionXiuProb: number;
  aiConfidence: number;
  actualResult?: string;
}

interface Bet {
  roundId: string;
  betType: 'TAI' | 'XIU';
  amount: number;
}

export default function GamePage() {
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [socket, setSocket] = useState<any>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [selectedBet, setSelectedBet] = useState<'TAI' | 'XIU' | null>(null);
  const [bettingSummary, setBettingSummary] = useState(null);
  const [userBalance, setUserBalance] = useState(1000);
  const [roundTimer, setRoundTimer] = useState(60);
  const [bettingActive, setBettingActive] = useState(true);

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to game server');
      newSocket.emit('join-game', { username: 'Player' });
    });

    newSocket.on('round-info', (round: Round) => {
      setCurrentRound(round);
      setRoundTimer(60);
      setBettingActive(true);
    });

    newSocket.on('betting-update', (summary) => {
      setBettingSummary(summary);
    });

    newSocket.on('betting-closed', () => {
      setBettingActive(false);
    });

    newSocket.on('round-result', (result) => {
      setCurrentRound(result);
    });

    return () => newSocket.close();
  }, []);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setRoundTimer((prev) => (prev > 0 ? prev - 1 : 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePlaceBet = async () => {
    if (!selectedBet || !currentRound) return;

    if (betAmount > userBalance) {
      alert('Insufficient balance');
      return;
    }

    socket?.emit('place-bet', {
      userId: 'user-id', // Should come from auth context
      roundId: currentRound.id,
      betType: selectedBet,
      amount: betAmount
    });

    setUserBalance(userBalance - betAmount);
    setSelectedBet(null);
  };

  if (!currentRound) {
    return <div className="flex items-center justify-center h-screen">Loading game...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur border-b border-green-500/30 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-green-400">🎮 Tài Xỉu AI</h1>
            <p className="text-gray-400">Round #{currentRound.roundNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400">Balance</p>
            <p className="text-2xl font-bold text-yellow-400">₫ {userBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Game Area */}
        <div className="lg:col-span-2">
          {/* Round Timer */}
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-8 mb-8 text-center">
            <p className="text-gray-400 mb-2">Time Remaining</p>
            <p className="text-6xl font-bold text-purple-400">{roundTimer}s</p>
          </div>

          {/* AI Prediction */}
          <div className="bg-black/60 border border-cyan-500/30 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-cyan-400 mb-4">🤖 AI Prediction</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className={`p-6 rounded-lg text-center transition-all ${
                currentRound.predictionTaiProb > currentRound.predictionXiuProb
                  ? 'bg-red-900/40 border-2 border-red-500'
                  : 'bg-gray-800/30 border border-gray-600'
              }`}>
                <p className="text-red-400 font-bold mb-2">TÀI (High)</p>
                <p className="text-3xl font-bold text-red-500">{currentRound.predictionTaiProb}%</p>
              </div>
              <div className={`p-6 rounded-lg text-center transition-all ${
                currentRound.predictionXiuProb > currentRound.predictionTaiProb
                  ? 'bg-blue-900/40 border-2 border-blue-500'
                  : 'bg-gray-800/30 border border-gray-600'
              }`}>
                <p className="text-blue-400 font-bold mb-2">XỈU (Low)</p>
                <p className="text-3xl font-bold text-blue-500">{currentRound.predictionXiuProb}%</p>
              </div>
            </div>
            <p className="text-center text-green-400 font-bold mt-4">Confidence: {currentRound.aiConfidence}%</p>
          </div>

          {/* Betting Info */}
          {bettingSummary && (
            <div className="bg-black/60 border border-yellow-500/30 rounded-lg p-6">
              <h2 className="text-lg font-bold text-yellow-400 mb-4">📊 Betting Stats</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Total Bets on TÀI</p>
                  <p className="text-red-400 font-bold">{bettingSummary.taiBets} bets</p>
                </div>
                <div>
                  <p className="text-gray-400">Total Bets on XỈU</p>
                  <p className="text-blue-400 font-bold">{bettingSummary.xiuBets} bets</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Betting Panel */}
        <div className="bg-gradient-to-b from-green-900/30 to-emerald-900/30 border border-green-500/50 rounded-lg p-8 sticky top-8">
          <h2 className="text-2xl font-bold text-green-400 mb-6">💰 Place Bet</h2>

          {/* Bet Type Selection */}
          <div className="space-y-4 mb-8">
            <button
              onClick={() => setSelectedBet('TAI')}
              className={`w-full py-4 px-6 rounded-lg font-bold transition-all ${
                selectedBet === 'TAI'
                  ? 'bg-red-600 border-2 border-red-400 text-white'
                  : 'bg-gray-800 border border-gray-600 text-gray-300 hover:border-red-400'
              }`}
            >
              🔴 TÀI (High)
            </button>
            <button
              onClick={() => setSelectedBet('XIU')}
              className={`w-full py-4 px-6 rounded-lg font-bold transition-all ${
                selectedBet === 'XIU'
                  ? 'bg-blue-600 border-2 border-blue-400 text-white'
                  : 'bg-gray-800 border border-gray-600 text-gray-300 hover:border-blue-400'
              }`}
            >
              🔵 XỈU (Low)
            </button>
          </div>

          {/* Bet Amount */}
          <div className="mb-8">
            <label className="block text-gray-400 text-sm mb-2">Bet Amount (₫)</label>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(parseFloat(e.target.value))}
              disabled={!bettingActive}
              className="w-full bg-gray-900 border border-green-500/30 rounded px-4 py-2 text-white focus:outline-none focus:border-green-500 disabled:opacity-50"
            />
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2 mb-8">
            {[100, 500, 1000].map((amount) => (
              <button
                key={amount}
                onClick={() => setBetAmount(amount)}
                className="bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-gray-300 font-bold"
              >
                ₫{amount}
              </button>
            ))}
          </div>

          {/* Place Bet Button */}
          <button
            onClick={handlePlaceBet}
            disabled={!selectedBet || !bettingActive || betAmount > userBalance}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-all text-lg mb-4"
          >
            🎯 Place Bet
          </button>

          {!bettingActive && (
            <p className="text-center text-orange-400 text-sm font-bold">Betting is closed</p>
          )}

          {/* Result Display */}
          {currentRound.actualResult && (
            <div className={`mt-6 p-4 rounded-lg text-center ${
              currentRound.actualResult === 'TAI'
                ? 'bg-red-900/40 border border-red-500'
                : 'bg-blue-900/40 border border-blue-500'
            }`}>
              <p className="text-gray-400 mb-2">Result</p>
              <p className="text-3xl font-bold">{currentRound.actualResult}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
