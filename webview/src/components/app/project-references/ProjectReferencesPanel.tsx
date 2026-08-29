import React from 'react';
import { FolderGit2, Layers } from 'lucide-react';
import { CollapsibleCard } from '@/components/app/collapsible-card';
import { useProjectReferences } from './hooks/useProjectReferences';
import { ProjectReferencesPanelProps } from './model/prj-model-ui';

import { NewReferenceForm } from './components/NewReferenceForm';
import { ReferencesFilterBar } from './components/ReferencesFilterBar';
import { ReferencesTable } from './components/ReferencesTable';
import { LocalStorageCard } from './components/LocalStorageCard';

export function ProjectReferencesPanel({
  localDocumentStorage = 'default',
  viewMode: initialViewMode = 'User',
  parentCollapsible = true,
  className,
}: ProjectReferencesPanelProps) {
  const {
    groupedReferences,
    sortedReferences,
    categories,
    emojis,
    categorySelectionStates,
    loading,
    importing,
    viewMode,
    setViewMode,
    isGrouped,
    setIsGrouped,
    categoryFilter,
    setCategoryFilter,
    emojiFilter,
    setEmojiFilter,
    preSelectedOnly,
    setPreSelectedOnly,
    globalFilter,
    setGlobalFilter,
    sortRules,
    handleSort,
    clearSort,
    expandedCategories,
    toggleCategoryExpand,
    expandAllCategories,
    collapseAllCategories,
    toggleCategorySelectAll,
    toggleReferenceSelect,
    addReference,
    removeReference,
    removeSelectedReferences,
    reloadReference,
    reloadSelectedReferences,
    importUrl,
    totalSelectedCount,
    totalSelectedSizeKb,
    totalCount,
    totalSizeKb,
  } = useProjectReferences(localDocumentStorage, initialViewMode);

  const innerContent = (
    <div className="space-y-2 p-2">
      {/* New Reference Creation Form (Placed BEFORE Filter Bar in Administrator View) */}
      {viewMode === 'Administrator' && (
        <NewReferenceForm
          categories={categories}
          importing={importing}
          onAddReference={addReference}
          onImportUrl={importUrl}
        />
      )}

      {/* Filter, Search & View Controls Bar */}
      <ReferencesFilterBar
        isGrouped={isGrouped}
        onToggleGrouped={setIsGrouped}
        categories={categories}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        emojis={emojis}
        emojiFilter={emojiFilter}
        onEmojiFilterChange={setEmojiFilter}
        preSelectedOnly={preSelectedOnly}
        onPreSelectedOnlyChange={setPreSelectedOnly}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        viewMode={viewMode}
        onViewModeToggle={setViewMode}
      />

      {/* References Registry Table */}
      <CollapsibleCard
        title={
          <div className="flex items-center gap-1.5">
            <Layers size={13} className="text-indigo-400" />
            <span className="font-bold text-xs">References Registry</span>
          </div>
        }
        badge={`${totalCount} Items`}
        defaultExpanded={true}
        contentToCopy=""
        className="bg-card border-border"
      >
        <ReferencesTable
          isGrouped={isGrouped}
          groupedReferences={groupedReferences}
          sortedReferences={sortedReferences}
          categorySelectionStates={categorySelectionStates}
          expandedCategories={expandedCategories}
          onToggleCategoryExpand={toggleCategoryExpand}
          onExpandAllCategories={expandAllCategories}
          onCollapseAllCategories={collapseAllCategories}
          onToggleCategorySelectAll={toggleCategorySelectAll}
          onToggleReferenceSelect={toggleReferenceSelect}
          onReloadReference={reloadReference}
          onReloadSelectedReferences={reloadSelectedReferences}
          onRemoveReference={removeReference}
          onRemoveSelectedReferences={removeSelectedReferences}
          loading={loading}
          importing={importing}
          sortRules={sortRules}
          onHandleSort={handleSort}
          onClearSort={clearSort}
          totalSelectedCount={totalSelectedCount}
          totalCount={totalCount}
          totalSelectedSizeKb={totalSelectedSizeKb}
          totalSizeKb={totalSizeKb}
          viewMode={viewMode}
        />
      </CollapsibleCard>

      {/* Local Storage Card Details (Admin mode) */}
      {viewMode === 'Administrator' && (
        <LocalStorageCard localDocumentStorage={localDocumentStorage} />
      )}
    </div>
  );

  return (
    <div className={`font-mono text-xs ${className || ''}`}>
      {parentCollapsible ? (
        <CollapsibleCard
          title={
            <div className="flex items-center gap-2">
              <FolderGit2 size={15} className="text-indigo-400 shrink-0" />
              <span className="font-bold text-foreground text-xs uppercase tracking-wide">
                Project References & Context
              </span>
            </div>
          }
          badge={`${totalSelectedCount} / ${totalCount} Selected (${totalSelectedSizeKb} KB)`}
          defaultExpanded={true}
          contentToCopy=""
          className="bg-card shadow-sm border-border"
        >
          {innerContent}
        </CollapsibleCard>
      ) : (
        <div className="bg-card shadow-sm border border-border rounded-lg">
          <div className="flex justify-between items-center bg-muted/20 p-2 border-border border-b">
            <div className="flex items-center gap-2">
              <FolderGit2 size={15} className="text-indigo-400 shrink-0" />
              <span className="font-bold text-foreground text-xs uppercase tracking-wide">
                Project References & Context
              </span>
            </div>
            <span className="inline-flex items-center bg-indigo-500/10 px-1.5 py-0.5 border border-indigo-500/20 rounded font-mono text-[10px] text-indigo-400">
              {totalSelectedCount} / {totalCount} Selected ({totalSelectedSizeKb} KB)
            </span>
          </div>
          {innerContent}
        </div>
      )}
    </div>
  );
}
