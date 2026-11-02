import React from "react";
import { Link } from "@tanstack/react-router";

export interface CheckoutProgressBarProps {
  currentStep: 1 | 2 | 3;
  onStepClick?: (step: 1 | 2 | 3) => void;
  canNavigateToStep?: (step: 1 | 2 | 3) => boolean;
  cartItemCount?: number;
  selectedAddressText?: string;
  className?: string;
}

export function CheckoutProgressBar({
  currentStep,
  onStepClick,
  canNavigateToStep,
  cartItemCount = 0,
  selectedAddressText = "",
  className = "",
}: CheckoutProgressBarProps) {
  const steps: Array<{
    id: 1 | 2 | 3;
    title: string;
    subtitle: string;
    icon: string;
  }> = [
    {
      id: 1,
      title: "1. Cart",
      subtitle: cartItemCount > 0 ? `${cartItemCount} Fresh Items` : "Review Items",
      icon: "shopping_bag",
    },
    {
      id: 2,
      title: "2. Address & Slot",
      subtitle: selectedAddressText || "Delivery & Slot",
      icon: "local_shipping",
    },
    {
      id: 3,
      title: "3. Payment",
      subtitle: "Instant UPI & Cards",
      icon: "credit_card",
    },
  ];

  const handleStepClick = (stepId: 1 | 2 | 3) => {
    if (stepId === currentStep) return;

    if (stepId < currentStep) {
      onStepClick?.(stepId);
      return;
    }

    // Attempting to go forward
    if (canNavigateToStep && canNavigateToStep(stepId)) {
      onStepClick?.(stepId);
    }
  };

  return (
    <div
      data-testid="checkout-progress-bar"
      className={`bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-4 sm:p-5 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between relative max-w-2xl mx-auto">
        {steps.map((step, idx) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isUpcoming = step.id > currentStep;
          const isClickable =
            isCompleted || (canNavigateToStep ? canNavigateToStep(step.id) : false);

          return (
            <React.Fragment key={step.id}>
              {/* Connector line between steps */}
              {idx > 0 && (
                <div
                  data-testid={`progress-connector-${step.id}`}
                  className={`flex-1 h-1 mx-2 sm:mx-4 rounded-full transition-colors duration-300 ${
                    currentStep >= step.id ? "bg-primary" : "bg-outline-variant/20"
                  }`}
                />
              )}

              {/* Step indicator node */}
              <div
                data-testid={`progress-step-${step.id}`}
                onClick={() => handleStepClick(step.id)}
                className={`flex items-center gap-2.5 sm:gap-3 transition-all select-none ${
                  isClickable
                    ? "cursor-pointer group hover:opacity-90"
                    : isCurrent
                      ? "cursor-default"
                      : "cursor-not-allowed opacity-60"
                }`}
                title={
                  isClickable
                    ? `Go to ${step.title}`
                    : isCurrent
                      ? `Current Step: ${step.title}`
                      : `Complete earlier steps to access ${step.title}`
                }
              >
                {/* Circle badge */}
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 transition-transform ${
                    isCompleted
                      ? "bg-primary text-white shadow-sm group-hover:scale-105"
                      : isCurrent
                        ? "bg-primary text-white ring-4 ring-primary/20 shadow-md scale-105"
                        : "bg-surface-container-high text-on-surface-variant/80 border border-outline-variant/30"
                  }`}
                >
                  {isCompleted ? (
                    <span className="material-symbols-outlined text-[18px] sm:text-[20px] font-bold">
                      check
                    </span>
                  ) : (
                    <span
                      className="material-symbols-outlined text-[18px] sm:text-[20px]"
                      style={isCurrent ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      {step.icon}
                    </span>
                  )}
                </div>

                {/* Step labels */}
                <div className="hidden xs:block sm:block text-left">
                  <div
                    className={`font-headline-sm text-xs sm:text-sm font-extrabold leading-tight ${
                      isCurrent
                        ? "text-primary"
                        : isCompleted
                          ? "text-on-surface"
                          : "text-on-surface-variant/70"
                    }`}
                  >
                    {step.title}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-on-surface-variant font-medium line-clamp-1 max-w-[120px] sm:max-w-none">
                    {step.subtitle}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

