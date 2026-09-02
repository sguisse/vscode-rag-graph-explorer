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
  onTransformReference,
}: ProjectReferencesPanelProps) {
  const {
    groupedReferences,
    sortedReferences,
    categories,
    emojis,
    categorySelectionStates,
    globalSelectionState,
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
    selectedOnly,
    setSelectedOnly,
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
    toggleAllSelect,
    resetSelection,
    addReference,
    removeReference,
    removeSelectedReferences,
    reloadReference,
    reloadSelectedReferences,
    importUrl,
    totalSelectedCount,
    totalSelectedSizeKb,
    totalSelectedTransfoSizeKb,
    totalAllCount,
    totalAllSizeKb,
    totalAllTransfoSizeKb,
    totalCount,
  } = useProjectReferences(localDocumentStorage, initialViewMode);

  const innerPanel = (
    <TopMiddleBottomPanel
      id="project-references-top-middle-bottom"
      className="gap-2 py-2 w-full h-full"
      top={
        <div className="space-y-2">
          <ReferencesFilterBar
            isGrouped={isGrouped}
            onToggleGrouped={setIsGrouped}
            categories={categories}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            emojis={emojis}
            emojiFilter={emojiFilter}
            onEmojiFilterChange={setEmojiFilter}
            selectedOnly={selectedOnly}
            onSelectedOnlyChange={setSelectedOnly}
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
          className="flex flex-col bg-card border-border h-full min-h-0"
        >
          <ReferencesTable
            isGrouped={isGrouped}
            groupedReferences={groupedReferences}
            sortedReferences={sortedReferences}
            categorySelectionStates={categorySelectionStates}
            globalSelectionState={globalSelectionState}
            expandedCategories={expandedCategories}
            onToggleCategoryExpand={toggleCategoryExpand}
            onExpandAllCategories={expandAllCategories}
            onCollapseAllCategories={collapseAllCategories}
            onToggleCategorySelectAll={toggleCategorySelectAll}
            onToggleReferenceSelect={toggleReferenceSelect}
            onToggleAllSelect={toggleAllSelect}
            onResetSelection={resetSelection}
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
            totalAllCount={totalAllCount}
            totalSelectedSizeKb={totalSelectedSizeKb}
            totalSelectedTransfoSizeKb={totalSelectedTransfoSizeKb}
            totalAllSizeKb={totalAllSizeKb}
            totalAllTransfoSizeKb={totalAllTransfoSizeKb}
            viewMode={viewMode}
            onTransformReference={onTransformReference}
          />
        </CollapsibleCard>
      }
      bottom={
        viewMode === 'Administrator' ? (
          <div className="space-y-2">
            <NewReferenceForm
              categories={categories}
              importing={importing}
              onAddReference={addReference}
              onImportUrl={importUrl}
            />
            <LocalStorageCard localDocumentStorage={localDocumentStorage} />
          </div>
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
          badge={`${totalSelectedCount} / ${totalAllCount} Selected for a Size of ${totalSelectedTransfoSizeKb} KB / ${totalSelectedSizeKb} KB`}
          defaultExpanded={false}
          contentToCopy=""
          className="flex flex-col bg-card shadow-sm border-border h-full min-h-0"
        >
          {innerPanel}
        </CollapsibleCard>
      ) : (
        innerPanel
      )}
    </div>
  );
}
