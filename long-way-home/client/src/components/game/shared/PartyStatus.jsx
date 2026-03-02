export default function PartyStatus({ members, morale, food, cash }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-trail-darkBrown mb-2">Party</h3>
      <div className="space-y-1">
        {members.map(m => (
          <div key={m.name} className="flex justify-between items-center text-sm">
            <span className={`${!m.alive ? 'line-through text-gray-400' : ''}`}>
              {m.name}
              {m.isChaplain && <span className="text-trail-gold ml-1 text-xs">(Chaplain)</span>}
              {m.isPlayer && <span className="text-trail-blue ml-1 text-xs">(You)</span>}
            </span>
            <HealthBadge health={m.alive ? m.health : 'dead'} />
          </div>
        ))}
      </div>

      {/* Morale bar */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-trail-brown mb-1">
          <span>Morale</span>
          <span>{morale}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              morale >= 60 ? 'bg-green-500' : morale >= 30 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${morale}%` }}
          />
        </div>
      </div>

      {/* Warnings */}
      {food < 50 && food > 0 && (
        <div className="mt-2 text-xs text-orange-600 font-semibold">Low food warning!</div>
      )}
      {food <= 0 && (
        <div className="mt-2 text-xs text-red-600 font-bold">No food! Your party is starving!</div>
      )}
    </div>
  );
}

function HealthBadge({ health }) {
  const colors = {
    good: 'bg-green-100 text-green-700',
    fair: 'bg-yellow-100 text-yellow-700',
    poor: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700 font-bold',
    dead: 'bg-gray-100 text-gray-500'
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs ${colors[health] || colors.good}`}>
      {health}
    </span>
  );
}
