import { useState, useEffect, useCallback, useMemo } from 'react';
import { graphRagInstallerApiService } from '@/services/api/graph-rag-installer-api.service.gen';
import { FinalInstallStatusReport } from '@/shared/services/graph-rag-explorer/model/install-result.model';
import { Server, Database, Layers, Coffee, Code2, Box, Terminal } from 'lucide-react';

export type FilterType = 'ALL' | 'ERRORS' | 'CORE';

const getModuleMetadata = (key: string) => {
  if (key.includes('core')) return { icon: Server, name: 'System Core' };
  if (key.includes('neo4j')) return { icon: Database, name: 'Neo4j Database' };
  if (key.includes('graph_rag')) return { icon: Layers, name: 'Java Graph RAG' };
  if (key.includes('jqassistant')) return { icon: Coffee, name: key.replace(/_/g, ' ').replace('01', '').trim() };
  if (key.includes('python')) return { icon: Code2, name: 'Python Graphify' };
  if (key.includes('cruiser') || key.includes('swc')) return { icon: Box, name: key.replace(/_/g, ' ').trim() };
  return { icon: Terminal, name: key.replace(/_/g, ' ') };
};

export function useInstallPanel() {
  const [reportData, setReportData] = useState<FinalInstallStatusReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);

    // 1. Safeguard timeout: reject after 5 seconds if extension host RPC hangs
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('RPC_TIMEOUT')), 5000)
    );

    try {
      const rawData = await Promise.race([
        graphRagInstallerApiService.readInstallationReport(),
        timeoutPromise
      ]);

      // 2. Handle both Object payloads and stringified JSON returns
      let parsedData: FinalInstallStatusReport | null = null;
      if (typeof rawData === 'string') {
        try {
          parsedData = JSON.parse(rawData);
        } catch {
          parsedData = null;
        }
      } else if (rawData && typeof rawData === 'object') {
        parsedData = rawData as FinalInstallStatusReport;
      }

      if (parsedData && parsedData.summary) {
        setReportData(parsedData);
        setIsError(false);
      } else {
        setReportData(null);
        setIsError(true);
      }
    } catch (err) {
      setReportData(null);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const globalSummary = reportData?.summary ?? null;

  const modules = useMemo(() => {
    if (!reportData) return [];
    const q = searchQuery.toLowerCase().trim();

    return Object.entries(reportData)
      .filter(([key]) => key !== 'summary')
      .map(([key, data]: [string, any]) => ({
        id: key,
        ...getModuleMetadata(key),
        ...data,
      }))
      .filter((mod) => {
        if (filter === 'ERRORS') return mod.summary?.koCount > 0;
        if (filter === 'CORE') return mod.id.startsWith('01_');
        return true;
      })
      .filter((mod) => {
        if (!q) return true;

        const modMatch = mod.name.toLowerCase().includes(q) || mod.id.toLowerCase().includes(q);
        if (modMatch) return true;

        const stepEntries = Object.entries(mod).filter(
          ([k]) => !['summary', 'id', 'name', 'icon'].includes(k)
        );

        return stepEntries.some(([stepKey, stepData]: [string, any]) => {
          const checkNameMatch = stepKey.toLowerCase().includes(q);
          const messageMatch = stepData?.message?.toLowerCase().includes(q);
          const pathMatch = (stepData?.path || stepData?.location || stepData?.version)?.toLowerCase().includes(q);
          return checkNameMatch || messageMatch || pathMatch;
        });
      })
      .sort((a, b) => {
        if (a.id === '01_system_core') return -1;
        if (b.id === '01_system_core') return 1;

        if (a.id.startsWith('01_') && !b.id.startsWith('01_')) return -1;
        if (!a.id.startsWith('01_') && b.id.startsWith('01_')) return 1;

        return (b.summary?.koCount ?? 0) - (a.summary?.koCount ?? 0);
      });
  }, [reportData, filter, searchQuery]);

  return {
    reportData,
    globalSummary,
    modules,
    isLoading,
    isError,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    handleRerun: fetchReport,
  };
}
