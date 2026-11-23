import React from "react";

export interface CheckoutProgressBarProps {
  currentStep: 1 | 2 | 3 | 4;
  onStepClick?: (step: 1 | 2 | 3 | 4) => void;
  canNavigateToStep?: (step: 1 | 2 | 3 | 4) => boolean;
  cartItemCount?: number;
  selectedAddressText?: string;
  className?: string;
  hideCartStep?: boolean;
}

export function CheckoutProgressBar({
  currentStep,
  onStepClick,
  canNavigateToStep,
  cartItemCount = 0,
  selectedAddressText = "",
  className = "",
  hideCartStep = false,
}: CheckoutProgressBarProps) {
  const steps: Array<{
    id: 1 | 2 | 3 | 4;
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
      title: "2. Address & Delivery",
      subtitle: selectedAddressText || "Delivery & Slot",
      icon: "local_shipping",
    },
    {
      id: 3,
      title: "3. Confirm Details",
      subtitle: "Confirm address and items",
      icon: "fact_check",
    },
    {
      id: 4,
      title: "4. Payment",
      subtitle: "Choose payment method",
      icon: "payments",
    },
  ];

  const handleStepClick = (stepId: 1 | 2 | 3 | 4) => {
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

  const visibleSteps = hideCartStep ? steps.filter((step) => step.id !== 1) : steps;

  return (
    <div
      data-testid="checkout-progress-bar"
      className={`bg-surface-container-lowest border border-outline-variant/15 rounded-2xl px-3 py-2 sm:p-5 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between relative max-w-3xl mx-auto">
        {visibleSteps.map((step, idx) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
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
                className={`flex items-center transition-all select-none ${hideCartStep ? "flex-col gap-1 sm:flex-row sm:gap-2.5" : "gap-2.5 sm:gap-3"} ${
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
                <div className={`${hideCartStep ? "block min-w-0 text-center sm:text-left" : "hidden xs:block sm:block text-left"}`}>
                  <div
                    className={`font-headline-sm ${hideCartStep ? "text-[10px] sm:text-sm" : "text-xs sm:text-sm"} font-extrabold leading-tight ${
                      isCurrent
                        ? "text-primary"
                        : isCompleted
                          ? "text-on-surface"
                          : "text-on-surface-variant/70"
                    }`}
                  >
                    {hideCartStep ? (
                      <>
                        <span className="sm:hidden">{step.id === 2 ? "Address" : step.id === 3 ? "Confirm" : "Payment"}</span>
                        <span className="hidden sm:inline">{step.title}</span>
                      </>
                    ) : step.title}
                  </div>
                  <div className={`${hideCartStep ? "hidden sm:block" : "block"} text-[10px] sm:text-[11px] text-on-surface-variant font-medium line-clamp-1 max-w-[120px] sm:max-w-none`}>
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

