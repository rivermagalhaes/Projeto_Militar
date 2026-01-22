import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Download, Loader2, Database, FileJson, FileSpreadsheet, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface BackupExportProps {
  isAdmin: boolean;
}

export function BackupExport({ isAdmin }: BackupExportProps) {
  const [exporting, setExporting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  if (!isAdmin) return null;

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToJSON = async () => {
    setExporting(true);
    try {
      // Fetch all main tables
      const [alunosRes, turmasRes, anotacoesRes, elogiosRes, termosRes, faltasRes, agendaRes] = await Promise.all([
        supabase.from('alunos').select('*'),
        supabase.from('turmas').select('*'),
        supabase.from('anotacoes').select('*'),
        supabase.from('elogios').select('*'),
        supabase.from('termos').select('*'),
        supabase.from('faltas').select('*'),
        supabase.from('agenda').select('*'),
      ]);

      const backup = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        tables: {
          alunos: alunosRes.data || [],
          turmas: turmasRes.data || [],
          anotacoes: anotacoesRes.data || [],
          elogios: elogiosRes.data || [],
          termos: termosRes.data || [],
          faltas: faltasRes.data || [],
          agenda: agendaRes.data || [],
        },
      };

      const filename = `backup-cmto-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
      downloadFile(JSON.stringify(backup, null, 2), filename, 'application/json');

      // Log audit
      await supabase.rpc('log_lgpd_audit', {
        p_acao: 'BACKUP_EXPORT_JSON',
        p_tabela_afetada: 'all',
      });

      toast.success('Backup JSON exportado com sucesso!');
      setModalOpen(false);
    } catch (error: any) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar backup: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = async () => {
    setExporting(true);
    try {
      // Export alunos as CSV
      const { data: alunos } = await supabase.from('alunos').select('*');

      if (!alunos || alunos.length === 0) {
        toast.error('Nenhum aluno para exportar');
        setExporting(false);
        return;
      }

      // Create CSV
      const headers = Object.keys(alunos[0]).join(',');
      const rows = alunos.map((aluno) =>
        Object.values(aluno)
          .map((val) => {
            if (val === null) return '';
            if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
            return val;
          })
          .join(',')
      );
      const csv = [headers, ...rows].join('\n');

      const filename = `alunos-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
      downloadFile(csv, filename, 'text/csv');

      // Log audit
      await supabase.rpc('log_lgpd_audit', {
        p_acao: 'BACKUP_EXPORT_CSV',
        p_tabela_afetada: 'alunos',
      });

      toast.success('CSV de alunos exportado com sucesso!');
      setModalOpen(false);
    } catch (error: any) {
      console.error('Erro ao exportar CSV:', error);
      toast.error('Erro ao exportar CSV: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  const exportAuditLogs = async () => {
    setExporting(true);
    try {
      const { data: logs } = await supabase
        .from('auditoria_lgpd')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (!logs || logs.length === 0) {
        toast.error('Nenhum log de auditoria');
        setExporting(false);
        return;
      }

      const filename = `auditoria-lgpd-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
      downloadFile(JSON.stringify(logs, null, 2), filename, 'application/json');

      toast.success('Logs de auditoria exportados!');
      setModalOpen(false);
    } catch (error: any) {
      console.error('Erro ao exportar logs:', error);
      toast.error('Erro ao exportar logs: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Database className="h-4 w-4" />
          Backup
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Exportar Backup
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Exporte os dados do sistema para backup. Todos os exports são registrados na auditoria LGPD.
          </p>

          <div className="grid gap-3">
            <Button
              onClick={exportToJSON}
              disabled={exporting}
              className="w-full justify-start gap-3"
              variant="outline"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileJson className="h-4 w-4 text-blue-500" />
              )}
              <div className="text-left">
                <div className="font-medium">Backup Completo (JSON)</div>
                <div className="text-xs text-muted-foreground">Todas as tabelas principais</div>
              </div>
            </Button>

            <Button
              onClick={exportToCSV}
              disabled={exporting}
              className="w-full justify-start gap-3"
              variant="outline"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 text-green-500" />
              )}
              <div className="text-left">
                <div className="font-medium">Alunos (CSV)</div>
                <div className="text-xs text-muted-foreground">Planilha de alunos</div>
              </div>
            </Button>

            <Button
              onClick={exportAuditLogs}
              disabled={exporting}
              className="w-full justify-start gap-3"
              variant="outline"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4 text-amber-500" />
              )}
              <div className="text-left">
                <div className="font-medium">Logs de Auditoria</div>
                <div className="text-xs text-muted-foreground">Últimos 1000 registros LGPD</div>
              </div>
            </Button>
          </div>

          <div className="text-xs text-muted-foreground border-t pt-3 mt-3">
            <strong>Nota:</strong> Para backups automáticos do banco de dados, utilize o painel de administração do backend.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
