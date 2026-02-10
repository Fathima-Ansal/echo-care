import { CheckCircle, Circle } from 'lucide-react';

export default function MedicationItem({ name, time, taken, onToggle }) {
    return (
        <button
            onClick={onToggle}
            className={`
        w-full flex items-center justify-between p-5 rounded-2xl border mb-3 transition-colors
        ${taken
                    ? 'bg-[#388E3C]/10 border-[#388E3C]/30 opacity-60'
                    : 'bg-white border-gray-100 hover:border-gray-300'
                }
      `}
        >
            <div className="flex flex-col items-start">
                <span className={`text-xl font-semibold ${taken ? 'text-gray-500 line-through' : 'text-[#222222]'}`}>
                    {name}
                </span>
                <span className="text-gray-500 text-base">{time}</span>
            </div>

            {taken ? (
                <CheckCircle className="w-10 h-10 text-[#388E3C]" />
            ) : (
                <Circle className="w-10 h-10 text-gray-300" />
            )}
        </button>
    );
}
