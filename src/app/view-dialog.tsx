"use client";

import { Check, SlidersHorizontal } from "lucide-react";
import { Field, FieldGroup, inputClass } from "@/components/field";
import { IconButton } from "@/components/icon-button";
import { Modal, useModal } from "@/components/modal";
import {
  STATUSES,
  STATUS_LABELS,
  type Status,
  type StatusCounts,
} from "@/lib/statuses";
import {
  DEFAULT_GROUP,
  DEFAULT_SORT,
  GROUPS,
  SORTS,
  type Group,
  type Sort,
} from "@/lib/view";
import { useView } from "./view-provider";

/**
 * One place for the three things that decide what the grid shows. Choices
 * apply as they are made, so the dialog dismisses rather than commits; they
 * are remembered by the provider, not carried in the URL.
 */
export function ViewDialog({ counts }: { counts: StatusCounts }) {
  const modal = useModal();
  const { status, sort, group, setStatus, setSort, setGroup, resetView } =
    useView();

  const changed =
    status !== undefined || sort !== DEFAULT_SORT || group !== DEFAULT_GROUP;

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
      <div className="border-l border-line">
        <IconButton
          label="View options"
          size="lg"
          variant={changed ? "accent" : "ghost"}
          onClick={modal.openModal}
          icon={
            <SlidersHorizontal
              size={22}
              strokeWidth={2.25}
              aria-hidden="true"
            />
          }
        />
      </div>

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

          <Field label="Sort">
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as Sort)}
              className={inputClass}
            >
              {SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Group by">
            <select
              value={group}
              onChange={(event) => setGroup(event.target.value as Group)}
              className={inputClass}
            >
              {GROUPS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex items-center justify-between gap-3 border-t border-line pt-5">
            <button
              type="button"
              onClick={resetView}
              className="px-1 py-3 text-base font-medium text-muted hover:text-ink"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={modal.closeModal}
              className="border border-line px-5 py-3 text-base font-medium hover:border-accent"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
