import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle, Pencil, Trash2, Search, FileText, FileCheck } from 'lucide-react';
import {  } from '@/api/Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import EditParticipantDialog from './EditParticipantDialog';

export default function ParticipantsList({ participants, eventId, event }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [viewingProof, setViewingProof] = useState(null);
  const queryClient = useQueryClient();

  const deleteParticipantMutation = useMutation({
    mutationFn: (participantId) => .entities.Participant.delete(participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants', eventId] });
    },
  });

  const handleDelete = (participant) => {
    if (window.confirm(`Tem certeza que deseja excluir ${participant.full_name}?`)) {
      deleteParticipantMutation.mutate(participant.id);
    }
  };

  const getPaymentBadge = (status) => {
    switch (status) {
      case 'pago':
        return <Badge className="bg-green-100 text-green-800">Pago</Badge>;
      case 'isento':
        return <Badge className="bg-blue-100 text-blue-800">Isento</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredParticipants = participants.filter(p =>
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cpf?.includes(searchTerm)
  );

  return (
    <>
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Participantes inscritos
            </h2>
            <Badge variant="outline" className="text-sm px-3 py-1 mt-2">
              {participants.length} {participants.length === 1 ? 'inscrito' : 'inscritos'}
            </Badge>
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar participante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredParticipants.length === 0 ? (
          <p className="text-center text-slate-500 py-8">
            {searchTerm ? 'Nenhum participante encontrado' : 'Nenhum participante inscrito ainda'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Nome
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    CPF
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Pagamento
                  </th>
                  {event?.is_paid && (
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      Comprovante
                    </th>
                  )}
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Check-in
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Presença
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Certificado
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredParticipants.map((participant) => (
                  <tr key={participant.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-900">
                      {participant.full_name}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {participant.email}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {participant.cpf}
                    </td>
                    <td className="py-3 px-4">
                      {getPaymentBadge(participant.payment_status)}
                    </td>
                    {event?.is_paid && (
                      <td className="py-3 px-4">
                        {participant.payment_proof_url ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingProof(participant.payment_proof_url)}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400">Sem comprovante</span>
                        )}
                      </td>
                    )}
                    <td className="py-3 px-4">
                      {participant.check_in_status ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-slate-300" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {participant.attendance_percentage}%
                    </td>
                    <td className="py-3 px-4">
                      {participant.certificate_issued ? (
                        <FileCheck className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-slate-300" />
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingParticipant(participant)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(participant)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editingParticipant && (
        <EditParticipantDialog
          participant={editingParticipant}
          eventId={eventId}
          onClose={() => setEditingParticipant(null)}
        />
      )}

      {viewingProof && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewingProof(null)}>
          <div className="bg-white rounded-lg p-4 max-w-2xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Comprovante de Pagamento</h3>
              <Button variant="ghost" size="sm" onClick={() => setViewingProof(null)}>✕</Button>
            </div>
            <img src={viewingProof} alt="Comprovante" className="w-full rounded" />
          </div>
        </div>
      )}
    </>
  );
}