
import React, { useEffect, useState } from 'react';
import { Appointment } from '../types';
import { Calendar, CheckCircle2, Clock, User, Phone, Briefcase, Trash2 } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

const AgendaView: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAppointments = async () => {
        try {
            const res = await fetch(`${API_URL}/appointments`);
            const data = await res.json();
            if (Array.isArray(data)) setAppointments(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
        const interval = setInterval(fetchAppointments, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const toggleStatus = async (id: string, current: boolean) => {
        // Optimistic update
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, completed: !current } : a));
        try {
            await fetch(`${API_URL}/appointments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !current })
            });
        } catch (e) {
            console.error("Failed to update");
            fetchAppointments(); // Revert on error
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;

        // Optimistic UI update
        setAppointments(prev => prev.filter(a => a.id !== id));

        try {
            await fetch(`${API_URL}/appointments/${id}`, { method: 'DELETE' });
        } catch (e) {
            console.error("Failed to delete");
            fetchAppointments(); // Revert
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Calendar className="text-blue-600" /> Agenda Digital
                    </h2>
                    <p className="text-gray-500">Agendamentos confirmados automaticamente pela IA.</p>
                </div>
                <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-xs font-bold uppercase">
                    {appointments.length} Agendamentos
                </div>
            </header>

            {loading ? (
                <div className="text-center py-20 text-gray-400">Carregando...</div>
            ) : appointments.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    <Calendar size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 font-medium">Nenhum agendamento confirmado ainda.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {appointments.map((appt) => (
                        <div key={appt.id} className={`bg-white p-6 rounded-2xl border transition-all ${appt.completed ? 'border-green-100 bg-green-50/30 opacity-70' : 'border-gray-100 shadow-sm hover:shadow-md'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${appt.completed ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <h4 className={`font-bold text-sm ${appt.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{appt.client}</h4>
                                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                            <Phone size={10} /> {appt.phone}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => toggleStatus(appt.id, appt.completed)}
                                        title={appt.completed ? "Reabrir" : "Concluir"}
                                        className={`p-2 rounded-lg transition-colors ${appt.completed ? 'text-green-600 bg-green-100 hover:bg-green-200' : 'text-gray-300 hover:text-green-500 hover:bg-gray-50'}`}
                                    >
                                        <CheckCircle2 size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(appt.id)}
                                        title="Cancelar Agendamento"
                                        className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-xs text-gray-600 bg-gray-50/50 p-2 rounded-lg">
                                    <Clock size={14} className="text-orange-400" />
                                    <span className="font-bold">{appt.date}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-600 bg-gray-50/50 p-2 rounded-lg">
                                    <Briefcase size={14} className="text-purple-400" />
                                    <span className="font-medium">{appt.service}</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                                <span className="text-[9px] text-gray-300 uppercase font-bold">
                                    Confirmado em {new Date(appt.createdAt).toLocaleDateString()}
                                </span>
                                {appt.completed && <span className="text-[9px] font-bold text-green-600 uppercase bg-green-100 px-2 py-0.5 rounded">Concluído</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AgendaView;
