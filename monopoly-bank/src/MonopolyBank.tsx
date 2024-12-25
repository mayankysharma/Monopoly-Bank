import React, { useState } from 'react';
import {
  DollarSign,
  Send,
  Plus,
  ArrowRight,
  Palette,
  Undo2,
  Users
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from './components/ui/card'; 
// ^ Adjust the path if you change your folder structure or 
//   if you use an alias like "@/components/ui/card"

interface Player {
  id: number;
  name: string;
  balance: number;
  color: string;
}

interface TransactionRecord {
  players: Player[];
  description: string;
  timestamp: string;
}

const MonopolyBank: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: 'Player 1', balance: 1500, color: '#FF0000' },
    { id: 2, name: 'Player 2', balance: 1500, color: '#0000FF' }
  ]);

  const [history, setHistory] = useState<TransactionRecord[]>([]);
  const [sourcePlayer, setSourcePlayer] = useState<number | null>(null);
  const [targetPlayers, setTargetPlayers] = useState<Set<number>>(new Set());
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'add' | 'subtract' | 'transfer'>('add');
  const [editingName, setEditingName] = useState<number | null>(null);
  const [multiSelectMode, setMultiSelectMode] = useState(false);

  const clearSelections = () => {
    setSourcePlayer(null);
    setTargetPlayers(new Set());
  };

  const addNewPlayer = () => {
    const oldState = [...players];
    const newPlayer = {
      id: players.length + 1,
      name: `Player ${players.length + 1}`,
      balance: 1500,
      color: `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, '0')}`
    };
    setPlayers([...players, newPlayer]);
    setHistory([
      {
        players: oldState,
        description: `Added new player: ${newPlayer.name}`,
        timestamp: new Date().toLocaleTimeString()
      },
      ...history
    ]);
  };

  const updatePlayerColor = (playerId: number, color: string) => {
    const oldState = [...players];
    setPlayers(players.map(player =>
      player.id === playerId ? { ...player, color } : player
    ));
    setHistory([
      {
        players: oldState,
        description: `Changed color for ${
          players.find(p => p.id === playerId)?.name
        }`,
        timestamp: new Date().toLocaleTimeString()
      },
      ...history
    ]);
  };

  const updatePlayerName = (playerId: number, newName: string) => {
    const oldState = [...players];
    const oldName = players.find(p => p.id === playerId)?.name;
    setPlayers(players.map(player =>
      player.id === playerId ? { ...player, name: newName } : player
    ));
    setHistory([
      {
        players: oldState,
        description: `Renamed ${oldName} to ${newName}`,
        timestamp: new Date().toLocaleTimeString()
      },
      ...history
    ]);
    setEditingName(null);
  };

  const handleTransaction = () => {
    if (!amount) return;

    const oldState = [...players];
    const timestamp = new Date().toLocaleTimeString();
    let description = '';

    if (transactionType === 'transfer') {
      if (!sourcePlayer || targetPlayers.size === 0) return;
      const totalAmount = parseInt(amount);
      if (isNaN(totalAmount)) return;

      const perPlayerAmount = Math.floor(totalAmount / targetPlayers.size);
      setPlayers(players.map(player => {
        if (player.id === sourcePlayer) {
          return { ...player, balance: player.balance - totalAmount };
        }
        if (targetPlayers.has(player.id)) {
          return { ...player, balance: player.balance + perPlayerAmount };
        }
        return player;
      }));

      const sourceName = players.find(p => p.id === sourcePlayer)?.name;
      const targetNames = Array.from(targetPlayers)
        .map(id => players.find(p => p.id === id)?.name)
        .join(', ');
      description = `Transfer $${totalAmount} from ${sourceName} to ${targetNames} ($${perPlayerAmount} each)`;
    } else {
      // 'add' or 'subtract'
      const totalAmount = parseInt(amount);
      if (isNaN(totalAmount)) return;

      // If multiSelectMode is true, use targetPlayers as the set of IDs
      // Otherwise, single select, so just use sourcePlayer
      const targetIds = multiSelectMode ? targetPlayers : new Set([sourcePlayer!]);

      setPlayers(players.map(player => {
        if (targetIds.has(player.id)) {
          return {
            ...player,
            balance:
              transactionType === 'add'
                ? player.balance + totalAmount
                : player.balance - totalAmount
          };
        }
        return player;
      }));

      const playerNames = Array.from(targetIds)
        .map(id => players.find(p => p.id === id)?.name)
        .join(', ');

      description =
        transactionType === 'add'
          ? `Added $${totalAmount} to ${playerNames}`
          : `Subtracted $${totalAmount} from ${playerNames}`;
    }

    setHistory([{ players: oldState, description, timestamp }, ...history]);
    setAmount('');
    if (!multiSelectMode) {
      setTargetPlayers(new Set());
      setSourcePlayer(null);
    }
  };

  const handlePlayerClick = (playerId: number) => {
    if (transactionType === 'transfer') {
      if (!sourcePlayer) {
        // If we have no source selected yet, set this player as the source
        setSourcePlayer(playerId);
      } else if (sourcePlayer !== playerId) {
        // If we already have a source, toggle this player in the target set
        const newTargets = new Set(targetPlayers);
        if (newTargets.has(playerId)) {
          newTargets.delete(playerId);
        } else {
          newTargets.add(playerId);
        }
        setTargetPlayers(newTargets);
      }
    } else if (multiSelectMode) {
      // Toggle this player in the target set
      const newTargets = new Set(targetPlayers);
      if (newTargets.has(playerId)) {
        newTargets.delete(playerId);
      } else {
        newTargets.add(playerId);
      }
      setTargetPlayers(newTargets);
    } else {
      // Single select
      setSourcePlayer(playerId);
      setTargetPlayers(new Set());
    }
  };

  const undoLastTransaction = () => {
    if (history.length === 0) return;
    const lastTransaction = history[0];
    setPlayers(lastTransaction.players);
    setHistory(history.slice(1));
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-6 w-6" />
              Monopoly Bank
            </CardTitle>
            <div className="flex gap-2">
              {transactionType !== 'transfer' && (
                <button
                  onClick={() => {
                    setMultiSelectMode(!multiSelectMode);
                    clearSelections();
                  }}
                  className={`flex items-center gap-2 px-3 py-1 rounded border ${
                    multiSelectMode ? 'bg-blue-100' : ''
                  }`}
                >
                  <Users className="h-4 w-4" />
                  Multi-select
                </button>
              )}
              <button
                onClick={undoLastTransaction}
                disabled={history.length === 0}
                className="flex items-center gap-2 px-3 py-1 rounded border disabled:opacity-50"
              >
                <Undo2 className="h-4 w-4" />
                Undo
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map(player => (
              <Card
                key={player.id}
                className={`${
                  sourcePlayer === player.id ? 'ring-2 ring-blue-500' : ''
                } ${
                  targetPlayers.has(player.id) ? 'ring-2 ring-green-500' : ''
                } ${
                  multiSelectMode && targetPlayers.has(player.id)
                    ? 'ring-2 ring-blue-500'
                    : ''
                }`}
                onClick={() => handlePlayerClick(player.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    {editingName === player.id ? (
                      <input
                        type="text"
                        defaultValue={player.name}
                        className="border rounded px-2 py-1"
                        onBlur={(e) =>
                          updatePlayerName(player.id, e.target.value)
                        }
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            updatePlayerName(
                              player.id,
                              (e.target as HTMLInputElement).value
                            );
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    ) : (
                      <h3
                        className="font-bold"
                        onDoubleClick={() => setEditingName(player.id)}
                      >
                        {player.name}
                      </h3>
                    )}
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      <input
                        type="color"
                        value={player.color}
                        onChange={(e) =>
                          updatePlayerColor(player.id, e.target.value)
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="w-6 h-6 cursor-pointer"
                      />
                    </div>
                  </div>
                  <div
                    className="text-2xl p-2 rounded"
                    style={{ backgroundColor: `${player.color}20` }}
                  >
                    ${player.balance}
                  </div>
                </CardContent>
              </Card>
            ))}
            <Card
              className="cursor-pointer hover:bg-gray-50"
              onClick={addNewPlayer}
            >
              <CardContent className="p-4 flex items-center justify-center">
                <Plus className="h-6 w-6" />
                <span className="ml-2">Add Player</span>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <select
              className="p-2 border rounded"
              value={transactionType}
              onChange={(e) => {
                setTransactionType(e.target.value as 'add' | 'subtract' | 'transfer');
                clearSelections();
                setMultiSelectMode(false);
              }}
            >
              <option value="add">Add Money</option>
              <option value="subtract">Subtract Money</option>
              <option value="transfer">Transfer Money</option>
            </select>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="p-2 border rounded"
            />
            <button
              onClick={handleTransaction}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                !amount ||
                (!multiSelectMode && !sourcePlayer) ||
                (transactionType === 'transfer' &&
                  (!sourcePlayer || targetPlayers.size === 0))
              }
            >
              {transactionType === 'transfer' ? (
                <ArrowRight className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit
            </button>
          </div>

          {transactionType === 'transfer' && (
            <div className="mt-4 text-gray-600">
              {!sourcePlayer && 'Select source player'}
              {sourcePlayer && targetPlayers.size === 0 && 'Select target player(s)'}
              {sourcePlayer && targetPlayers.size > 0 && (
                <span>
                  Transfer ${amount || '0'} from{' '}
                  {players.find(p => p.id === sourcePlayer)?.name} to{' '}
                  {Array.from(targetPlayers)
                    .map(id => players.find(p => p.id === id)?.name)
                    .join(', ')}
                  {amount && targetPlayers.size > 0 && (
                    <span>
                      {' '}
                      (${Math.floor(parseInt(amount) / targetPlayers.size)} each)
                    </span>
                  )}
                </span>
              )}
            </div>
          )}

          {history.length > 0 && (
            <div className="mt-6">
              <h3 className="font-bold mb-2">Transaction History</h3>
              <div className="max-h-40 overflow-y-auto">
                {history.map((transaction, index) => (
                  <div key={index} className="text-sm text-gray-600 mb-1">
                    {transaction.timestamp}: {transaction.description}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonopolyBank;
