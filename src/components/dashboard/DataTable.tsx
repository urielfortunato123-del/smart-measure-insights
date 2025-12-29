import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';
import { MeasurementEntry } from '@/types/measurement';

interface DataTableProps {
  data: MeasurementEntry[];
}

type SortField = 'date' | 'valorTotal' | 'quantidade';
type SortDirection = 'asc' | 'desc';

export const DataTable = ({ data }: DataTableProps) => {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filteredData = data.filter(item => 
    item.descricao.toLowerCase().includes(search.toLowerCase()) ||
    item.responsavel.toLowerCase().includes(search.toLowerCase()) ||
    item.local.toLowerCase().includes(search.toLowerCase()) ||
    item.disciplina.toLowerCase().includes(search.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    
    if (sortField === 'date') {
      return multiplier * a.date.localeCompare(b.date);
    }
    return multiplier * (a[sortField] - b[sortField]);
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      maximumFractionDigits: 2 
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4 inline ml-1" /> : 
      <ChevronDown className="h-4 w-4 inline ml-1" />;
  };

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Navegador de Dados</CardTitle>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar medições..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead 
                    className="cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('date')}
                  >
                    Data <SortIcon field="date" />
                  </TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('quantidade')}
                  >
                    Qtd <SortIcon field="quantidade" />
                  </TableHead>
                  <TableHead className="text-center">Un.</TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('valorTotal')}
                  >
                    Valor Total <SortIcon field="valorTotal" />
                  </TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((item) => (
                  <TableRow 
                    key={item.id} 
                    className={`border-border ${item.status === 'outlier' ? 'bg-warning/5' : ''}`}
                  >
                    <TableCell className="font-medium">{formatDate(item.date)}</TableCell>
                    <TableCell>{item.responsavel}</TableCell>
                    <TableCell className="text-muted-foreground">{item.local}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {item.disciplina}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={item.descricao}>
                      {item.descricao}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(item.quantidade)}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {item.unidade}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatValue(item.valorTotal)}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.status === 'outlier' ? (
                        <Badge variant="outline" className="border-warning text-warning">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Outlier
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-success text-success">
                          Normal
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          Exibindo {sortedData.length} de {data.length} registros
        </p>
      </CardContent>
    </Card>
  );
};
