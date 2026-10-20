"use client";

import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  LayoutGrid,
  Minus,
} from "lucide-react";
import { Button } from "@/components/button";
import {
  controlAction,
  controlHeight,
  Field,
  FieldGroup,
  Select,
} from "@/components/field";
import { FormFooter } from "@/components/form";
import { HeartGlyph } from "@/components/heart";
import { Modal, useModal } from "@/components/modal";
import { StatusBadge } from "@/components/status-badge";
import {
  STATUSES,
  STATUS_LABELS,
  type Status,
  type StatusCounts,
} from "@/lib/statuses";
import {
  DEFAULT_DIRECTION,
  DEFAULT_FAVOURITES_FIRST,
  DEFAULT_GROUP,
  DEFAULT_SORT,
  GROUPS,
  SORTS,
  type Group,
  type Sort,
} from "@/lib/view";
import { TopBarAction } from "./top-bar-action";
import { useView } from "./view-provider";

type CheckState = boolean | "mixed";

/**
 * One place for the choices that decide what the grid shows. Changes apply as
 * they are made, so the dialog dismisses rather than commits; they are
 * remembered by the provider, not carried in the URL.
 */
export function ViewDialog({ counts }: { counts: StatusCounts }) {
  const modal = useModal();
  const {
    statuses,
    sort,
    direction,
    group,
    favouritesFirst,
    setAllStatuses,
    clearStatuses,
    toggleStatus,
    setSort,
    invertDirection,
    setGroup,
    setFavouritesFirst,
    resetView,
  } = useView();

  const allSelected = STATUSES.every((status) => statuses.includes(status));
  const changed =
    !allSelected ||
    sort !== DEFAULT_SORT ||
    direction !== DEFAULT_DIRECTION ||
    group !== DEFAULT_GROUP ||
    favouritesFirst !== DEFAULT_FAVOURITES_FIRST;

  const options: {
    value?: Status;
    label: string;
    count: number;
    checked: CheckState;
  }[] = [
    // All selects every status, or clears them when they are all selected.
    // Partial selections show a dash, so the next click fills the rest.
    {
      value: undefined,
      label: "All",
      count: counts.all,
      checked: allSelected ? true : statuses.length > 0 ? "mixed" : false,
    },
    ...STATUSES.map((value) => ({
      value,
      label: STATUS_LABELS[value],
      count: counts[value],
      checked: statuses.includes(value),
    })),
  ];

  function toggleOption(value: Status | undefined) {
    if (value === undefined) {
      if (allSelected) {
        clearStatuses();
      } else {
        setAllStatuses();
      }
      return;
    }

    toggleStatus(value);
  }

  return (
    <>
      <TopBarAction
        label="View options"
        variant={changed ? "accent" : "ghost"}
        onClick={modal.openModal}
        icon={
          <Eye size={22} strokeWidth={2.25} aria-hidden="true" />
        }
      />

      <Modal open={modal.open} onClose={modal.closeModal} title="View options">
        <div className="flex flex-col gap-6">
          <FieldGroup legend="Status">
            <div className="flex flex-col divide-y divide-line border border-line">
              {options.map((option) => {
                const selected = option.checked !== false;

                return (
                  <button
                    key={option.label}
                    type="button"
                    role="checkbox"
                    aria-checked={option.checked}
                    onClick={() => toggleOption(option.value)}
                    className={`flex items-center justify-between px-4 py-3 text-left text-base transition-colors hover:bg-surface-2 motion-reduce:transition-none ${
                      selected ? "text-ink" : "text-muted"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      {option.value ? (
                        <StatusBadge
                          status={option.value}
                          decorative
                          className={
                            option.checked === true ? undefined : "opacity-50"
                          }
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="flex size-7 items-center justify-center"
                        >
                          <LayoutGrid
                            size={16}
                            strokeWidth={3}
                            aria-hidden="true"
                          />
                        </span>
                      )}
                      {option.label}
                    </span>
                    <span className="flex items-center gap-3 text-muted tabular-nums">
                      {option.count}
                      <SelectionMark checked={option.checked} />
                    </span>
                  </button>
                );
              })}
            </div>
          </FieldGroup>

          <FieldGroup legend="Sort">
            <div className="flex gap-2">
              <Select
                aria-label="Sort by"
                value={sort}
                onChange={(event) => setSort(event.target.value as Sort)}
                className={`${controlHeight} min-w-0 flex-1`}
              >
                {SORTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>

              <button
                type="button"
                onClick={invertDirection}
                aria-label={
                  direction === "asc" ? "Sort descending" : "Sort ascending"
                }
                className={`${controlAction} border border-line text-muted hover:border-accent hover:text-ink`}
              >
                {direction === "asc" ? (
                  <ArrowUp size={18} strokeWidth={2.25} aria-hidden="true" />
                ) : (
                  <ArrowDown size={18} strokeWidth={2.25} aria-hidden="true" />
                )}
              </button>
            </div>
          </FieldGroup>

          <Field label="Group by">
            <Select
              value={group}
              onChange={(event) => setGroup(event.target.value as Group)}
            >
              {GROUPS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <FieldGroup legend="Favourites">
            <button
              type="button"
              aria-label="Show favourites at top"
              aria-pressed={favouritesFirst}
              onClick={() => setFavouritesFirst(!favouritesFirst)}
              className={`flex items-center justify-between border border-line px-4 py-3 text-left text-base transition-colors motion-reduce:transition-none ${
                favouritesFirst
                  ? "bg-accent-strong text-white"
                  : "text-ink hover:bg-surface-2"
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-7 items-center justify-center"
                >
                  <HeartGlyph filled={favouritesFirst} />
                </span>
                Show at top
              </span>
              <span className={favouritesFirst ? "text-white" : "text-muted"}>
                {favouritesFirst ? "On" : "Off"}
              </span>
            </button>
          </FieldGroup>

          <FormFooter
            left={
              <Button variant="ghost" size="plain" onClick={resetView}>
                Reset
              </Button>
            }
          >
            <Button variant="outline" onClick={modal.closeModal}>
              Done
            </Button>
          </FormFooter>
        </div>
      </Modal>
    </>
  );
}

/** Square check mark for the multi-select status list. */
function SelectionMark({ checked }: { checked: CheckState }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-5 shrink-0 items-center justify-center border ${
        checked
          ? "border-accent-strong bg-accent-strong text-white"
          : "border-line"
      }`}
    >
      {checked === "mixed" ? (
        <Minus size={12} strokeWidth={3} aria-hidden="true" />
      ) : checked ? (
        <Check size={12} strokeWidth={3} aria-hidden="true" />
      ) : null}
    </span>
  );
}
