import React, { useState, useEffect } from 'react';
import {  } from '@/api/Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Search, User, ArrowLeft, CheckCircle2, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function ManageOrganizers() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingOrganizer, setEditingOrganizer] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    contact_phone: '',
    password: '',
    profile_image_url: '',
  });
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    email: '',
    contact_phone: '',
    profile_image_url: '',
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await .auth.me();
        if (currentUser.role !== 'admin') {
          window.location.href = '/';
        }
        setUser(currentUser);
      } catch (err) {
        .auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: organizers = [], isLoading } = useQuery({
    queryKey: ['organizers'],
    queryFn: async () => {
      const users = await .entities.User.list();
      return users.filter(u => u.role === 'user'); // 'user' role = organizer
    },
    enabled: !!user,
  });

  const createOrganizerMutation = useMutation({
    mutationFn: async (data) => {
      throw new Error('A plataforma Base44 não permite criação direta de usuários via código. Use o sistema de convite de usuários no painel administrativo da plataforma.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizers'] });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsDialogOpen(false);
      }, 2000);
      setFormData({ full_name: '', email: '', contact_phone: '', password: '', profile_image_url: '' });
    },
    onError: (error) => {
      alert(error.message || 'Erro ao criar organizador');
    },
  });

  const updateOrganizerMutation = useMutation({
    mutationFn: ({ id, data }) => .entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizers'] });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsEditDialogOpen(false);
        setEditingOrganizer(null);
      }, 2000);
    },
  });

  const deleteOrganizerMutation = useMutation({
    mutationFn: (id) => .entities.User.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizers'] });
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await .integrations.Core.UploadFile({ file });
      setFormData({ ...formData, profile_image_url: file_url });
    } catch (err) {
      alert('Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createOrganizerMutation.mutate(formData);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateOrganizerMutation.mutate({ id: editingOrganizer.id, data: editFormData });
  };

  const openEditDialog = (organizer) => {
    setEditingOrganizer(organizer);
    setEditFormData({
      full_name: organizer.full_name || '',
      email: organizer.email || '',
      contact_phone: organizer.contact_phone || '',
      profile_image_url: organizer.profile_image_url || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleEditFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await .integrations.Core.UploadFile({ file });
      setEditFormData({ ...editFormData, profile_image_url: file_url });
    } catch (err) {
      alert('Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const filteredOrganizers = organizers.filter(org =>
    org.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-6">
        <Card className="p-8">
          {/* Search and Add */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Procurar Usuários"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11"
              />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-slate-900 hover:bg-slate-800 text-white h-11 px-6">
                  + Adicionar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                {showSuccess ? (
                  <div className="py-12 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-900 mb-6">
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      Usuário registrado com sucesso!
                    </h2>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <Button
                        variant="ghost"
                        onClick={() => setIsDialogOpen(false)}
                        className="mb-2"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                      </Button>
                      <h2 className="text-2xl font-bold text-slate-900">Registro de usuários</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div>
                        <Label htmlFor="full_name">Nome completo *</Label>
                        <Input
                          id="full_name"
                          placeholder="Nome completo do organizador"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          required
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="contact_phone">Contato *</Label>
                        <Input
                          id="contact_phone"
                          placeholder="+55 11 99999-9999"
                          value={formData.contact_phone}
                          onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                          required
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Email do organizador"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="password">Senha *</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Senha de acesso"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="profile_image">Imagem de perfil</Label>
                        <div className="mt-1">
                          <Input
                            id="profile_image"
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            disabled={uploading}
                          />
                          <p className="text-xs text-slate-500 mt-1">Formatos válidos: JPG, PNG (opcional)</p>
                          {formData.profile_image_url && (
                            <img
                              src={formData.profile_image_url}
                              alt="Preview"
                              className="w-16 h-16 rounded-full object-cover mt-2"
                            />
                          )}
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={createOrganizerMutation.isPending || uploading}
                        className="w-full bg-slate-900 hover:bg-slate-800 h-11"
                      >
                        {createOrganizerMutation.isPending ? 'Registrando...' : 'Registrar usuário'}
                      </Button>
                    </form>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 border-b">
                  <TableHead>Nome ↑</TableHead>
                  <TableHead>Email ↑</TableHead>
                  <TableHead>Data de cadastro ↑</TableHead>
                  <TableHead>Contato ↑</TableHead>
                  <TableHead>Senha ↑</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
                    </TableCell>
                  </TableRow>
                ) : filteredOrganizers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      Nenhum organizador encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrganizers.map((organizer) => (
                    <TableRow key={organizer.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {organizer.profile_image_url ? (
                            <img
                              src={organizer.profile_image_url}
                              alt={organizer.full_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                              <User className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                          <span className="font-medium text-slate-900">{organizer.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">{organizer.email}</TableCell>
                      <TableCell className="text-slate-600">
                        {new Date(organizer.created_date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-slate-600">{organizer.contact_phone || '-'}</TableCell>
                      <TableCell className="text-slate-600">**********</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(organizer)}
                          className="hover:bg-slate-100"
                        >
                          <Edit className="w-4 h-4 text-slate-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>1-{filteredOrganizers.length} de {filteredOrganizers.length}</span>
          </div>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            {showSuccess ? (
              <div className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-900 mb-6">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Usuário atualizado com sucesso!
                </h2>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <Button
                    variant="ghost"
                    onClick={() => setIsEditDialogOpen(false)}
                    className="mb-2"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                  <h2 className="text-2xl font-bold text-slate-900">Editar usuário</h2>
                </div>
                <form onSubmit={handleEditSubmit} className="space-y-5">
                  <div>
                    <Label htmlFor="edit_full_name">Nome completo *</Label>
                    <Input
                      id="edit_full_name"
                      placeholder="Nome completo do organizador"
                      value={editFormData.full_name}
                      onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit_contact_phone">Contato *</Label>
                    <Input
                      id="edit_contact_phone"
                      placeholder="+55 11 99999-9999"
                      value={editFormData.contact_phone}
                      onChange={(e) => setEditFormData({ ...editFormData, contact_phone: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit_email">Email *</Label>
                    <Input
                      id="edit_email"
                      type="email"
                      placeholder="Email do organizador"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit_profile_image">Imagem de perfil</Label>
                    <div className="mt-1">
                      <Input
                        id="edit_profile_image"
                        type="file"
                        accept="image/*"
                        onChange={handleEditFileUpload}
                        disabled={uploading}
                      />
                      <p className="text-xs text-slate-500 mt-1">Formatos válidos: JPG, PNG</p>
                      {editFormData.profile_image_url && (
                        <img
                          src={editFormData.profile_image_url}
                          alt="Preview"
                          className="w-16 h-16 rounded-full object-cover mt-2"
                        />
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={updateOrganizerMutation.isPending || uploading}
                    className="w-full bg-slate-900 hover:bg-slate-800 h-11"
                  >
                    {updateOrganizerMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
                  </Button>
                </form>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}