"use client";

import { ArrowDown, ArrowUp, Check, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/button";
import { Field, FieldGroup, Select } from "@/components/field";
import { FormFooter } from "@/components/form";
import { Modal, useModal } from "@/components/modal";
import {
  STATUSES,
  STATUS_LABELS,
  type Status,
  type StatusCounts,
} from "@/lib/statuses";
import {
  DEFAULT_DIRECTION,
  DEFAULT_GROUP,
  DEFAULT_SORT,
  GROUPS,
  SORTS,
  type Group,
  type Sort,
} from "@/lib/view";
import { TopBarAction } from "./top-bar-action";
import { useView } from "./view-provider";

/**
 * One place for the three things that decide what the grid shows. Choices
 * apply as they are made, so the dialog dismisses rather than commits; they
 * are remembered by the provider, not carried in the URL.
 */
export function ViewDialog({ counts }: { counts: StatusCounts }) {
  const modal = useModal();
  const {
    status,
    sort,
    direction,
    group,
    setStatus,
    setSort,
    invertDirection,
    setGroup,
    resetView,
  } = useView();

  const changed =
    status !== undefined ||
    sort !== DEFAULT_SORT ||
    direction !== DEFAULT_DIRECTION ||
    group !== DEFAULT_GROUP;

  const options: { value?: Status; label: string; count: number }[] = [
    { value: undefined, label: "All", count: counts.all },
    ...STATUSES.map((value) => ({
      value,
      label: STATUS_LABELS[value],
      count: counts[value],
    })),
  ];

  return (
    <>
      <TopBarAction
        label="View options"
        variant={changed ? "accent" : "ghost"}
        onClick={modal.openModal}
        icon={
          <SlidersHorizontal size={22} strokeWidth={2.25} aria-hidden="true" />
        }
      />

      <Modal open={modal.open} onClose={modal.closeModal} title="View options">
        <div className="flex flex-col gap-6">
          <FieldGroup legend="Status">
            <div className="flex flex-col divide-y divide-line border border-line">
              {options.map((option) => {
                const active = option.value === status;

                return (
                  <button
                    key={option.label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setStatus(option.value)}
                    className={`flex items-center justify-between px-4 py-3 text-left text-base transition-colors motion-reduce:transition-none ${
                      active
                        ? "bg-accent-strong text-white"
                        : "text-ink hover:bg-surface-2"
                    }`}
                  >
                    {option.label}
                    {/* Full white on the accent fill: 80% white measures
                        3.83:1 there, under AA for this size. */}
                    <span
                      className={`flex items-center gap-3 ${
                        active ? "text-white" : "text-muted"
                      }`}
                    >
                      {option.count}
                      {active && (
                        <Check
                          size={18}
                          strokeWidth={3}
                          aria-hidden="true"
                        />
                      )}
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
                className="h-[50px] min-w-0 flex-1"
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
                className="flex size-[50px] shrink-0 items-center justify-center border border-line text-muted hover:border-accent hover:text-ink"
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
