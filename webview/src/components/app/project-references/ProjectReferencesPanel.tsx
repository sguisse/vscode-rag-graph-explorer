import React from 'react';
import { FolderGit2, Layers } from 'lucide-react';
import { CollapsibleCard } from '@/components/app/collapsible-card';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { useProjectReferences } from './hooks/useProjectReferences';
import { ProjectReferencesPanelProps } from './model/prj-model-ui';

import { NewReferenceForm } from './components/NewReferenceForm';
import { ReferencesFilterBar } from './components/ReferencesFilterBar';
import { ReferencesTable } from './components/ReferencesTable';
import { LocalStorageCard } from './components/LocalStorageCard';

export function ProjectReferencesPanel({
  localDocumentStorage = 'default',
  viewMode: initialViewMode = 'User',
  collapsibleParentIncluded = true,
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
    hideDescription,
    setHideDescription,
    hideUrl,
    setHideUrl,
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

  const innerPanel = (
    <TopMiddleBottomPanel
      id="project-references-top-middle-bottom"
      className="h-full w-full p-2 gap-2"
      top={
        <div className="space-y-2">
          {viewMode === 'Administrator' && (
            <NewReferenceForm
              categories={categories}
              importing={importing}
              onAddReference={addReference}
              onImportUrl={importUrl}
            />
          )}
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
            hideDescription={hideDescription}
            onHideDescriptionChange={setHideDescription}
            hideUrl={hideUrl}
            onHideUrlChange={setHideUrl}
            viewMode={viewMode}
            onViewModeToggle={setViewMode}
          />
        </div>
      }
      middle={
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
          className="bg-card border-border h-full flex flex-col min-h-0"
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
            hideDescription={hideDescription}
            hideUrl={hideUrl}
            totalSelectedCount={totalSelectedCount}
            totalCount={totalCount}
            totalSelectedSizeKb={totalSelectedSizeKb}
            totalSizeKb={totalSizeKb}
            viewMode={viewMode}
          />
        </CollapsibleCard>
      }
      bottom={
        viewMode === 'Administrator' ? (
          <LocalStorageCard localDocumentStorage={localDocumentStorage} />
        ) : null
      }
    />
  );

  return (
    <div className={`font-mono text-xs w-full h-full min-h-0 ${className || ''}`}>
      {collapsibleParentIncluded ? (
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
          className="bg-card shadow-sm border-border h-full flex flex-col min-h-0"
        >
          {innerPanel}
        </CollapsibleCard>
      ) : (
        innerPanel
      )}
    </div>
  );
}
