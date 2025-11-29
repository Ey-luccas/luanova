/**
 * Componente de Gestão de Reservas
 * 
 * Calendário e gestão completa de reservas de mesas
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parse, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

interface Table {
  id: number;
  number: string;
  name?: string;
  capacity: number;
}

interface Reservation {
  id: number;
  tableId?: number | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  reservationDate: string;
  reservationTime: string;
  numberOfPeople: number;
  notes?: string | null;
  status: string;
  arrivalDeadline?: string | null;
  confirmedAt?: string | null;
  seatedAt?: string | null;
  table?: Table | null;
}

interface ReservationManagementProps {
  companyId: string;
}

const reservationSchema = z.object({
  tableId: z.string().optional(),
  customerName: z.string().min(1, 'Nome é obrigatório'),
  customerPhone: z.string().min(1, 'Telefone é obrigatório'),
  customerEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  reservationDate: z.string().min(1, 'Data é obrigatória'),
  reservationTime: z.string().min(1, 'Horário é obrigatório'),
  numberOfPeople: z.string().min(1, 'Número de pessoas é obrigatório'),
  notes: z.string().optional(),
});

type ReservationFormData = z.infer<typeof reservationSchema>;

export function ReservationManagement({ companyId }: ReservationManagementProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReservationDialog, setShowReservationDialog] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
  });

  const reservationDate = watch('reservationDate');

  useEffect(() => {
    if (companyId) {
      fetchData();
      fetchTables();
    }
  }, [companyId, selectedDate]);

  const fetchData = async () => {
    if (!companyId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get(
        `/companies/${companyId}/restaurant/reservations`,
        {
          params: {
            date: selectedDate.toISOString(),
          },
        },
      );
      setReservations(response.data?.data || []);
    } catch (err: any) {
      console.error('Erro ao buscar reservas:', err);
      setError('Erro ao carregar reservas');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTables = async () => {
    if (!companyId) return;

    try {
      const response = await api.get(
        `/companies/${companyId}/restaurant/tables`,
      );
      setTables(response.data?.data || []);
    } catch (err: any) {
      console.error('Erro ao buscar mesas:', err);
    }
  };

  const handleCreateReservation = async (data: ReservationFormData) => {
    if (!companyId) return;

    try {
      setIsLoading(true);
      setError(null);

      const payload: any = {
        ...data,
        tableId: data.tableId ? parseInt(data.tableId, 10) : undefined,
        numberOfPeople: parseInt(data.numberOfPeople, 10),
        reservationDate: new Date(data.reservationDate),
      };

      await api.post(`/companies/${companyId}/restaurant/reservations`, payload);
      await fetchData();
      setShowReservationDialog(false);
      reset();
      setEditingReservation(null);
    } catch (err: any) {
      console.error('Erro ao criar reserva:', err);
      setError(err.response?.data?.message || 'Erro ao criar reserva');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateReservation = async (data: ReservationFormData) => {
    if (!companyId || !editingReservation) return;

    try {
      setIsLoading(true);
      setError(null);

      const payload: any = {
        ...data,
        tableId: data.tableId ? parseInt(data.tableId, 10) : undefined,
        numberOfPeople: parseInt(data.numberOfPeople, 10),
        reservationDate: new Date(data.reservationDate),
      };

      await api.put(
        `/companies/${companyId}/restaurant/reservations/${editingReservation.id}`,
        payload,
      );
      await fetchData();
      setShowReservationDialog(false);
      reset();
      setEditingReservation(null);
    } catch (err: any) {
      console.error('Erro ao atualizar reserva:', err);
      setError(err.response?.data?.message || 'Erro ao atualizar reserva');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReservation = async (reservationId: number) => {
    if (!companyId) return;
    if (!confirm('Tem certeza que deseja remover esta reserva?')) return;

    try {
      setIsLoading(true);
      setError(null);

      await api.delete(
        `/companies/${companyId}/restaurant/reservations/${reservationId}`,
      );
      await fetchData();
    } catch (err: any) {
      console.error('Erro ao remover reserva:', err);
      setError(err.response?.data?.message || 'Erro ao remover reserva');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (
    reservationId: number,
    status: string,
  ) => {
    if (!companyId) return;

    try {
      setIsLoading(true);
      setError(null);

      await api.put(
        `/companies/${companyId}/restaurant/reservations/${reservationId}`,
        { status },
      );
      await fetchData();
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err);
      setError(err.response?.data?.message || 'Erro ao atualizar status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditReservation = (reservation: Reservation) => {
    setEditingReservation(reservation);
    const date = new Date(reservation.reservationDate);
    reset({
      tableId: reservation.tableId?.toString() || '',
      customerName: reservation.customerName,
      customerPhone: reservation.customerPhone,
      customerEmail: reservation.customerEmail || '',
      reservationDate: format(date, 'yyyy-MM-dd'),
      reservationTime: reservation.reservationTime,
      numberOfPeople: reservation.numberOfPeople.toString(),
      notes: reservation.notes || '',
    });
    setShowReservationDialog(true);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
      case 'CONFIRMED':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
      case 'SEATED':
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
      case 'CANCELLED':
        return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
      case 'NO_SHOW':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'Pendente';
      case 'CONFIRMED':
        return 'Confirmada';
      case 'SEATED':
        return 'Sentada';
      case 'CANCELLED':
        return 'Cancelada';
      case 'NO_SHOW':
        return 'Não Compareceu';
      default:
        return status;
    }
  };

  // Gera dias da semana para o calendário
  const weekStart = startOfWeek(selectedDate, { locale: ptBR });
  const weekEnd = endOfWeek(selectedDate, { locale: ptBR });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getReservationsForDate = (date: Date): Reservation[] => {
    return reservations.filter((reservation) => {
      const resDate = new Date(reservation.reservationDate);
      return isSameDay(resDate, date);
    });
  };

  if (isLoading && reservations.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Gestão de Reservas
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie reservas de mesas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendário
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            Lista
          </Button>
          <Button
            onClick={() => {
              setEditingReservation(null);
              reset({
                reservationDate: format(selectedDate, 'yyyy-MM-dd'),
                reservationTime: '19:00',
                numberOfPeople: '2',
              });
              setShowReservationDialog(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Reserva
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {viewMode === 'calendar' ? (
        /* Vista de Calendário */
        <div className="space-y-4">
          {/* Navegação */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setSelectedDate(subDays(selectedDate, 7))}
            >
              ← Semana Anterior
            </Button>
            <div className="text-center">
              <p className="font-semibold">
                {format(weekStart, "d 'de' MMMM", { locale: ptBR })} -{' '}
                {format(weekEnd, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setSelectedDate(addDays(selectedDate, 7))}
            >
              Próxima Semana →
            </Button>
          </div>

          {/* Calendário */}
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, index) => {
              const dayReservations = getReservationsForDate(day);
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);

              return (
                <Card
                  key={index}
                  className={cn(
                    'cursor-pointer transition-all',
                    isToday && 'border-primary border-2',
                    isSelected && 'bg-primary/5',
                  )}
                  onClick={() => setSelectedDate(day)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-center">
                      {format(day, 'EEE', { locale: ptBR })}
                    </CardTitle>
                    <p className="text-center text-lg font-bold">
                      {format(day, 'd')}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1">
                      {dayReservations.slice(0, 3).map((reservation) => (
                        <div
                          key={reservation.id}
                          className={cn(
                            'text-xs p-1 rounded truncate',
                            getStatusColor(reservation.status),
                          )}
                          title={`${reservation.customerName} - ${reservation.reservationTime}`}
                        >
                          {reservation.reservationTime} - {reservation.customerName}
                        </div>
                      ))}
                      {dayReservations.length > 3 && (
                        <p className="text-xs text-center text-muted-foreground">
                          +{dayReservations.length - 3} mais
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Reservas do dia selecionado */}
          <Card>
            <CardHeader>
              <CardTitle>
                Reservas de {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getReservationsForDate(selectedDate).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma reserva para este dia
                </p>
              ) : (
                <div className="space-y-3">
                  {getReservationsForDate(selectedDate)
                    .sort((a, b) => a.reservationTime.localeCompare(b.reservationTime))
                    .map((reservation) => (
                      <div
                        key={reservation.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">
                              {reservation.reservationTime}
                            </span>
                            <span
                              className={cn(
                                'text-xs px-2 py-1 rounded',
                                getStatusColor(reservation.status),
                              )}
                            >
                              {getStatusLabel(reservation.status)}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium">{reservation.customerName}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {reservation.customerPhone}
                              </span>
                              {reservation.customerEmail && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {reservation.customerEmail}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {reservation.numberOfPeople} pessoas
                              </span>
                              {reservation.table && (
                                <span className="flex items-center gap-1">
                                  Mesa {reservation.table.number}
                                </span>
                              )}
                            </div>
                            {reservation.notes && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {reservation.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {reservation.status === 'PENDING' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleUpdateStatus(reservation.id, 'CONFIRMED')
                              }
                              disabled={isLoading}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Confirmar
                            </Button>
                          )}
                          {reservation.status === 'CONFIRMED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleUpdateStatus(reservation.id, 'SEATED')
                              }
                              disabled={isLoading}
                            >
                              <User className="h-4 w-4 mr-2" />
                              Sentar
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditReservation(reservation)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {reservation.status !== 'SEATED' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteReservation(reservation.id)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Vista de Lista */
        <div className="space-y-4">
          {reservations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma reserva encontrada
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {reservations
                .sort((a, b) => {
                  const dateA = new Date(`${a.reservationDate}T${a.reservationTime}`);
                  const dateB = new Date(`${b.reservationDate}T${b.reservationTime}`);
                  return dateA.getTime() - dateB.getTime();
                })
                .map((reservation) => (
                  <Card key={reservation.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-lg">
                              {reservation.customerName}
                            </span>
                            <span
                              className={cn(
                                'text-xs px-2 py-1 rounded',
                                getStatusColor(reservation.status),
                              )}
                            >
                              {getStatusLabel(reservation.status)}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>
                              {format(new Date(reservation.reservationDate), "d 'de' MMMM 'de' yyyy", { locale: ptBR })} às{' '}
                              {reservation.reservationTime}
                            </p>
                            <div className="flex items-center gap-4">
                              <span>📞 {reservation.customerPhone}</span>
                              {reservation.customerEmail && (
                                <span>✉️ {reservation.customerEmail}</span>
                              )}
                              <span>👥 {reservation.numberOfPeople} pessoas</span>
                              {reservation.table && (
                                <span>🪑 Mesa {reservation.table.number}</span>
                              )}
                            </div>
                            {reservation.notes && (
                              <p className="mt-2 italic">{reservation.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {reservation.status === 'PENDING' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleUpdateStatus(reservation.id, 'CONFIRMED')
                              }
                              disabled={isLoading}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Confirmar
                            </Button>
                          )}
                          {reservation.status === 'CONFIRMED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleUpdateStatus(reservation.id, 'SEATED')
                              }
                              disabled={isLoading}
                            >
                              <User className="h-4 w-4 mr-2" />
                              Sentar
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditReservation(reservation)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {reservation.status !== 'SEATED' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteReservation(reservation.id)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Dialog: Reserva */}
      <Dialog open={showReservationDialog} onOpenChange={setShowReservationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingReservation ? 'Editar Reserva' : 'Nova Reserva'}
            </DialogTitle>
            <DialogDescription>
              {editingReservation
                ? 'Atualize as informações da reserva'
                : 'Crie uma nova reserva de mesa'}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(
              editingReservation
                ? handleUpdateReservation
                : handleCreateReservation,
            )}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reservation-date">Data *</Label>
                <Input
                  id="reservation-date"
                  type="date"
                  {...register('reservationDate')}
                  className={cn(errors.reservationDate && 'border-destructive')}
                />
                {errors.reservationDate && (
                  <p className="text-sm text-destructive">
                    {errors.reservationDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reservation-time">Horário *</Label>
                <Input
                  id="reservation-time"
                  type="time"
                  {...register('reservationTime')}
                  className={cn(errors.reservationTime && 'border-destructive')}
                />
                {errors.reservationTime && (
                  <p className="text-sm text-destructive">
                    {errors.reservationTime.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservation-table">Mesa (Opcional)</Label>
              <Select
                value={watch('tableId') || ''}
                onValueChange={(value) => setValue('tableId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma mesa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem mesa específica</SelectItem>
                  {tables.map((table) => (
                    <SelectItem key={table.id} value={table.id.toString()}>
                      Mesa {table.number} ({table.capacity} pessoas)
                      {table.name && ` - ${table.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservation-customer-name">Nome do Cliente *</Label>
              <Input
                id="reservation-customer-name"
                {...register('customerName')}
                className={cn(errors.customerName && 'border-destructive')}
              />
              {errors.customerName && (
                <p className="text-sm text-destructive">
                  {errors.customerName.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reservation-customer-phone">Telefone *</Label>
                <Input
                  id="reservation-customer-phone"
                  type="tel"
                  {...register('customerPhone')}
                  className={cn(errors.customerPhone && 'border-destructive')}
                />
                {errors.customerPhone && (
                  <p className="text-sm text-destructive">
                    {errors.customerPhone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reservation-customer-email">Email</Label>
                <Input
                  id="reservation-customer-email"
                  type="email"
                  {...register('customerEmail')}
                  className={cn(errors.customerEmail && 'border-destructive')}
                />
                {errors.customerEmail && (
                  <p className="text-sm text-destructive">
                    {errors.customerEmail.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservation-number-of-people">Número de Pessoas *</Label>
              <Input
                id="reservation-number-of-people"
                type="number"
                min="1"
                {...register('numberOfPeople')}
                className={cn(errors.numberOfPeople && 'border-destructive')}
              />
              {errors.numberOfPeople && (
                <p className="text-sm text-destructive">
                  {errors.numberOfPeople.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservation-notes">Observações</Label>
              <Textarea
                id="reservation-notes"
                {...register('notes')}
                rows={3}
                placeholder="Ex: Cliente é alérgico a camarão, aniversário, etc."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowReservationDialog(false);
                  reset();
                  setEditingReservation(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {editingReservation ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

