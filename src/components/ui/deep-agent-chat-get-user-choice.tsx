// ─── User-choice tool controls ───────────────────────────────────────────────

import { cva } from 'class-variance-authority';
import { ArrowRight, Check, Pencil, X } from 'lucide-react';
import * as React from 'react';
import z from 'zod';

import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ─── Schema / types ─────────────────────────────────────────────────────────

export const GET_USER_CHOICE_TOOL_NAME = 'get_user_choice';
export const GET_USER_CHOICE_TOOL_DESCRIPTION =
  'Get one closed-ended choice selection in chat. MUST use this for predefined answers, including yes/no, either/or, multiple-choice, suggested meanings, clarification options, inline choices, or bullet choices. If you would list answer choices in prose, call this tool instead. Ask only one choice question per message; for sequences, wait for each result before asking the next. Do not invite freeform typing unless `allowOther` is enabled. You must ask a question before calling this tool to get the possible choices. Put all choices in `options`. Use `single` for one choice, `multiple` for pick-many. Cards are for described choices; chips are for short labels.';

const GET_USER_CHOICE_OTHER_VALUE = '__other__';

const getUserChoiceOptionSchema = z.object({
  value: z
    .string()
    .min(1)
    .describe('Stable machine value returned in the answer.'),
  label: z.string().describe('Visible option text shown to the user.'),
  description: z
    .string()
    .optional()
    .describe('Secondary option text. Shown on cards, ignored on chips.'),
});

export const getUserChoiceParametersSchema = z.object({
  // question: z
  //   .string()
  //   .min(1)
  //   .describe(
  //     'Visible prompt shown above the choice UI. Do not include answer choices here.',
  //   ),
  selectionMode: z.enum(['single', 'multiple']).default('single'),
  options: z
    .array(getUserChoiceOptionSchema)
    .min(1)
    .refine(
      (options) =>
        options.every(
          (option) => option.value.trim() !== GET_USER_CHOICE_OTHER_VALUE,
        ),
      {
        message: `Option values must be non-empty and cannot be ${GET_USER_CHOICE_OTHER_VALUE}`,
      },
    )
    .refine(
      (options) => {
        const values = options.map((option) => option.value);
        return new Set(values).size === values.length;
      },
      {
        message: 'Option values must be unique',
      },
    )
    .describe(
      'Complete set of predefined answer choices. For closed-ended questions, put every intended choice here instead of in prose.',
    ),
  allowOther: z
    .boolean()
    .optional()
    .describe(
      'Adds an Other option with a text input. Enable only when a valid answer may fall outside the predefined options.',
    ),
  otherLabel: z
    .string()
    .optional()
    .describe(
      'Label and text-input placeholder for the custom answer option. Defaults to "Other".',
    ),
  presentation: z
    .enum(['chips', 'cards'])
    .optional()
    .describe(
      'Option layout. Use cards for described choices and chips for short labels. Omit to auto-use cards when any option has a description.',
    ),
  submitButtonText: z.string().optional(),
});

export type GetUserChoiceParameters = Partial<
  z.infer<typeof getUserChoiceParametersSchema>
>;

export type GetUserChoiceOptions = NonNullable<
  GetUserChoiceParameters['options']
>;

export type GetUserChoiceOption = GetUserChoiceOptions[number];

export type GetUserChoiceResult =
  | { status: 'skipped' }
  | {
      status: 'answered';
      selectionMode: 'single';
      value: string | null;
      label: string | null;
      description?: string;
      other?: string;
    }
  | {
      status: 'answered';
      selectionMode: 'multiple';
      values: string[];
      labels: string[];
      descriptions?: string[];
      other?: string;
    };

export type GetUserChoiceSize = 'sm' | 'md' | 'lg';

// ─── Payload helpers ────────────────────────────────────────────────────────

const getSelectionMode = (parameters: GetUserChoiceParameters) =>
  parameters.selectionMode === 'multiple' ? 'multiple' : 'single';

const shouldRenderAsCards = (
  parameters: GetUserChoiceParameters,
  options: GetUserChoiceOptions,
) => {
  if (parameters.presentation === 'cards') {
    return true;
  }
  if (parameters.presentation === 'chips') {
    return false;
  }
  return options.some((option) => Boolean(option.description)) ?? false;
};

const getChoiceOptionLabel = (options: GetUserChoiceOptions, value: string) =>
  options?.find((option) => option.value === value)?.label ?? value;

const getChoiceOption = (options: GetUserChoiceOptions, value: string) =>
  options?.find((option) => option.value === value);

const getResultFormState = (
  result: GetUserChoiceResult | undefined,
): { selectedValues: string[]; otherAnswer: string } => {
  if (!result || result.status !== 'answered') {
    return { selectedValues: [], otherAnswer: '' };
  }

  if (result.selectionMode === 'multiple') {
    return {
      selectedValues: [
        ...result.values,
        ...(result.other ? [GET_USER_CHOICE_OTHER_VALUE] : []),
      ],
      otherAnswer: result.other ?? '',
    };
  }

  return {
    selectedValues: [
      result.other ? GET_USER_CHOICE_OTHER_VALUE : result.value,
    ].filter((value): value is string => Boolean(value)),
    otherAnswer: result.other ?? '',
  };
};

const buildChoiceResult = (
  parameters: GetUserChoiceParameters,
  options: GetUserChoiceOptions,
  selectedValues: string[],
  otherAnswer: string,
): GetUserChoiceResult => {
  const selectionMode = getSelectionMode(parameters);
  const trimmedOther = otherAnswer.trim();

  if (selectionMode === 'multiple') {
    const values = selectedValues.filter(
      (value) => value !== GET_USER_CHOICE_OTHER_VALUE,
    );
    const descriptions = values
      .map((value) => getChoiceOption(options, value)?.description)
      .filter((description): description is string => Boolean(description));
    return {
      status: 'answered',
      selectionMode: 'multiple',
      values,
      labels: values.map((value) => getChoiceOptionLabel(options, value)),
      ...(descriptions.length ? { descriptions } : {}),
      ...(selectedValues.includes(GET_USER_CHOICE_OTHER_VALUE) && trimmedOther
        ? { other: trimmedOther }
        : {}),
    };
  }

  const value = selectedValues[0] ?? '';
  if (value === GET_USER_CHOICE_OTHER_VALUE) {
    return {
      status: 'answered',
      selectionMode: 'single',
      value: null,
      label: null,
      ...(trimmedOther ? { other: trimmedOther } : {}),
    };
  }

  const selectedOption = getChoiceOption(options, value);
  return {
    status: 'answered',
    selectionMode: 'single',
    value,
    label: selectedOption?.label ?? value,
    ...(selectedOption?.description
      ? { description: selectedOption.description }
      : {}),
  };
};

const isChoiceInvalid = (
  parameters: GetUserChoiceParameters,
  selectedValues: string[],
  otherAnswer: string,
) => {
  if (selectedValues.length === 0) {
    return true;
  }
  if (
    selectedValues.includes(GET_USER_CHOICE_OTHER_VALUE) &&
    !otherAnswer.trim()
  ) {
    return true;
  }
  return (
    getSelectionMode(parameters) === 'single' && selectedValues.length !== 1
  );
};

// ─── Variants ───────────────────────────────────────────────────────────────

const getUserChoiceWrapperVariants = cva('flex w-full min-w-0 flex-col', {
  variants: {
    size: {
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8',
    },
  },
  defaultVariants: { size: 'md' },
});

const getUserChoiceFieldVariants = cva('', {
  variants: {
    size: {
      sm: 'gap-2.5',
      md: 'gap-3',
      lg: 'gap-3.5',
    },
  },
  defaultVariants: { size: 'md' },
});

const getUserChoiceChipItemVariants = cva(
  cn(
    'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-input bg-transparent text-base font-normal leading-normal text-foreground transition-colors disabled:cursor-default',
    'hover:bg-transparent hover:text-foreground hover:border-foreground',
    'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
    'data-[state=on]:border-2 data-[state=on]:border-primary data-[state=on]:-m-px',
  ),
  {
    variants: {
      size: {
        sm: 'h-7 min-w-7 px-3',
        md: 'h-8 min-w-8 px-4',
        lg: 'h-9 min-w-9 px-5',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

const getUserChoiceOtherChipItemVariants = cva(
  cn(
    'inline-flex cursor-pointer items-center justify-center rounded-full border border-input bg-transparent text-base font-normal leading-normal text-muted-foreground transition-colors disabled:cursor-default',
    'hover:bg-transparent hover:text-foreground hover:border-foreground',
    'data-[state=on]:bg-transparent data-[state=on]:text-foreground',
    'data-[state=on]:border-2 data-[state=on]:border-primary data-[state=on]:-m-px',
  ),
  {
    variants: {
      size: {
        sm: 'size-7',
        md: 'size-8',
        lg: 'size-9',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

const getUserChoiceOtherInputVariants = cva(
  'w-1/2 rounded-full bg-transparent text-base font-normal leading-normal shadow-none',
  {
    variants: {
      size: {
        sm: 'h-7 px-3 py-0.5',
        md: 'h-8 px-4 py-1',
        lg: 'h-9 px-5 py-1.5',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

const getUserChoiceCardItemVariants = cva(
  cn(
    'group/card relative flex w-full cursor-pointer items-start gap-3 rounded-xl border border-input bg-background text-left text-base font-normal leading-normal text-foreground transition-colors disabled:cursor-default',
    'hover:bg-background hover:text-foreground hover:border-foreground',
    'data-[state=on]:bg-background data-[state=on]:text-foreground',
    'data-[state=on]:border-foreground',
    'whitespace-normal',
  ),
  {
    variants: {
      size: {
        sm: 'h-auto px-3 py-2',
        md: 'h-auto px-3 py-2.5',
        lg: 'h-auto px-4 py-3',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

const getUserChoiceCardTitleVariants = cva(
  'text-base font-normal leading-normal',
  {
    variants: {
      size: {
        sm: '',
        md: '',
        lg: '',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

const getUserChoiceCardDescriptionVariants = cva(
  'mt-0.5 text-base font-normal leading-normal text-muted-foreground',
  {
    variants: {
      size: {
        sm: '',
        md: '',
        lg: '',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

const getUserChoiceCardIndicatorWrapperVariants = cva(
  'flex shrink-0 items-start justify-center self-stretch',
);

const getUserChoiceCardCheckIndicatorVariants = cva(
  'inline-flex shrink-0 items-center justify-center border transition-colors',
  {
    variants: {
      size: {
        sm: 'size-4',
        md: 'size-5',
        lg: 'size-5',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

const getUserChoiceCardCheckIconVariants = cva('', {
  variants: {
    size: {
      sm: 'size-3',
      md: 'size-3.5',
      lg: 'size-3.5',
    },
  },
  defaultVariants: { size: 'md' },
});

const getUserChoiceCardRadioDotVariants = cva('rounded-full bg-primary', {
  variants: {
    size: {
      sm: 'size-2',
      md: 'size-2.5',
      lg: 'size-2.5',
    },
  },
  defaultVariants: { size: 'md' },
});

const getUserChoiceChipsGroupClass =
  'flex w-full min-w-0 flex-wrap items-center justify-start';
const getUserChoiceCardsGroupClass =
  'flex w-full min-w-0 flex-col items-stretch justify-start';

const getUserChoiceActionRowVariants = cva(
  'flex w-full items-center justify-start',
  {
    variants: {
      size: {
        sm: 'gap-1.5',
        md: 'gap-2',
        lg: 'gap-2',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

const getUserChoiceIconVariants = cva('', {
  variants: {
    size: {
      sm: 'size-3.5',
      md: 'size-4',
      lg: 'size-4',
    },
  },
  defaultVariants: { size: 'md' },
});

const getUserChoiceClearButtonVariants = cva(
  cn(
    'inline-flex shrink-0 items-center justify-center rounded-full border border-input bg-background text-muted-foreground transition-colors',
    'hover:text-foreground hover:border-foreground',
  ),
  {
    variants: {
      size: {
        sm: 'size-7',
        md: 'size-8',
        lg: 'size-9',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

const getUserChoiceGroupSpacing = (size: GetUserChoiceSize): string =>
  size === 'sm' ? 'gap-1.5' : size === 'lg' ? 'gap-2.5' : 'gap-2';
const getUserChoiceCardsSubmitSpacing = (size: GetUserChoiceSize): string =>
  size === 'sm' ? 'mt-1.5' : size === 'lg' ? 'mt-2.5' : 'mt-2';

// ─── Subcomponents ──────────────────────────────────────────────────────────

function SendArrowButton({
  size,
  label,
  text,
  onClick,
  disabled,
}: {
  size: GetUserChoiceSize;
  label: string;
  text?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const buttonText = text?.trim();
  return (
    <Button
      type="button"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      aria-label={buttonText || label}
    >
      {buttonText ? <span>{buttonText}</span> : null}
      <ArrowRight className={cn(getUserChoiceIconVariants({ size }))} />
    </Button>
  );
}

function CardOptionContent({
  option,
  selectionMode,
  size,
  selected,
}: {
  option: GetUserChoiceOption;
  selectionMode: 'single' | 'multiple';
  size: GetUserChoiceSize;
  selected: boolean;
}) {
  return (
    <span className="flex min-w-0 flex-1 items-stretch gap-3">
      <span className="flex min-w-0 flex-1 flex-col">
        <span
          className={cn('min-w-0', getUserChoiceCardTitleVariants({ size }))}
        >
          {option.label}
        </span>
        {option.description && (
          <span className={cn(getUserChoiceCardDescriptionVariants({ size }))}>
            {option.description}
          </span>
        )}
      </span>
      <span className={cn(getUserChoiceCardIndicatorWrapperVariants())}>
        <span
          className={cn(
            getUserChoiceCardCheckIndicatorVariants({ size }),
            selectionMode === 'single' ? 'rounded-full' : 'rounded-md',
            selected
              ? selectionMode === 'single'
                ? 'border-primary bg-transparent'
                : 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-transparent',
          )}
          aria-hidden="true"
        >
          {selected &&
            (selectionMode === 'single' ? (
              <span
                className={cn(getUserChoiceCardRadioDotVariants({ size }))}
              />
            ) : (
              <Check
                className={cn(getUserChoiceCardCheckIconVariants({ size }))}
              />
            ))}
        </span>
      </span>
    </span>
  );
}

function ChoiceOptionButton({
  option,
  selectionMode,
  isCards,
  isSelected,
  isReadOnly,
  size,
  onSelect,
}: {
  option: GetUserChoiceOption;
  selectionMode: 'single' | 'multiple';
  isCards: boolean;
  isSelected: boolean;
  isReadOnly: boolean;
  size: GetUserChoiceSize;
  onSelect: (value: string) => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      role={selectionMode === 'single' ? 'radio' : 'checkbox'}
      aria-checked={isSelected}
      aria-label={
        isCards && option.description
          ? `${option.label}: ${option.description}`
          : undefined
      }
      data-state={isSelected ? 'on' : 'off'}
      disabled={isReadOnly}
      className={cn(
        isCards
          ? getUserChoiceCardItemVariants({ size })
          : getUserChoiceChipItemVariants({ size }),
      )}
      onClick={() => onSelect(option.value)}
    >
      {isCards ? (
        <CardOptionContent
          option={option}
          selectionMode={selectionMode}
          size={size}
          selected={isSelected}
        />
      ) : (
        <span>{option.label}</span>
      )}
    </Button>
  );
}

function OtherOptionButton({
  otherLabel,
  selectionMode,
  isCards,
  isSelected,
  isReadOnly,
  size,
  onSelect,
}: {
  otherLabel?: string;
  selectionMode: 'single' | 'multiple';
  isCards: boolean;
  isSelected: boolean;
  isReadOnly: boolean;
  size: GetUserChoiceSize;
  onSelect: (value: string) => void;
}) {
  const label = otherLabel || 'Other';
  return (
    <Button
      type="button"
      variant="ghost"
      size={isCards ? 'sm' : 'icon'}
      role={selectionMode === 'single' ? 'radio' : 'checkbox'}
      aria-checked={isSelected}
      aria-label={label}
      data-state={isSelected ? 'on' : 'off'}
      disabled={isReadOnly}
      className={cn(
        isCards
          ? getUserChoiceCardItemVariants({ size })
          : getUserChoiceOtherChipItemVariants({ size }),
        !isCards && 'h-auto w-auto',
      )}
      onClick={() => onSelect(GET_USER_CHOICE_OTHER_VALUE)}
    >
      {isCards ? (
        <CardOptionContent
          option={{
            value: GET_USER_CHOICE_OTHER_VALUE,
            label,
            description: undefined,
          }}
          selectionMode={selectionMode}
          size={size}
          selected={isSelected}
        />
      ) : (
        <Pencil className={cn(getUserChoiceIconVariants({ size }))} />
      )}
    </Button>
  );
}

function OtherAnswerInput({
  labelId,
  otherLabel,
  value,
  isInvalid,
  isReadOnly,
  size,
  submitButtonText,
  showSubmitButton,
  isSubmitDisabled,
  onChange,
  onClear,
  onSubmit,
}: {
  labelId: string;
  otherLabel?: string;
  value: string;
  isInvalid: boolean;
  isReadOnly: boolean;
  size: GetUserChoiceSize;
  submitButtonText?: string;
  showSubmitButton?: boolean;
  isSubmitDisabled?: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex w-full items-center gap-2">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={otherLabel || 'Other'}
        disabled={isReadOnly}
        aria-invalid={isInvalid || undefined}
        aria-labelledby={labelId}
        className={cn(getUserChoiceOtherInputVariants({ size }))}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={isReadOnly}
        aria-label="Clear other answer"
        className={cn(getUserChoiceClearButtonVariants({ size }))}
        onClick={onClear}
      >
        <X className={cn(getUserChoiceIconVariants({ size }))} />
      </Button>
      {showSubmitButton && (
        <SendArrowButton
          size={size}
          label="Send"
          text={submitButtonText}
          disabled={isSubmitDisabled}
          onClick={onSubmit}
        />
      )}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

interface GetUserChoiceToolProps {
  parameters: GetUserChoiceParameters;
  result?: GetUserChoiceResult;
  respond?: (result: unknown) => Promise<void>;
  size?: GetUserChoiceSize;
}

export function GetUserChoiceSkipped({
  parameters,
  size = 'md',
}: {
  parameters: GetUserChoiceParameters;
  size?: GetUserChoiceSize;
}) {
  return (
    <GetUserChoiceTool
      parameters={parameters}
      result={{ status: 'skipped' }}
      size={size}
    />
  );
}

export function GetUserChoiceTool({
  parameters,
  result,
  respond,
  size = 'md',
}: GetUserChoiceToolProps) {
  const formId = React.useId();
  const options = parameters.options ?? [];
  const [submittedResult, setSubmittedResult] = React.useState<
    GetUserChoiceResult | undefined
  >();
  const visibleResult = result ?? submittedResult;
  const initialFormState = React.useMemo(
    () => getResultFormState(visibleResult),
    [visibleResult],
  );
  const [selectedValues, setSelectedValues] = React.useState<string[]>(
    initialFormState.selectedValues,
  );
  const [otherAnswer, setOtherAnswer] = React.useState(
    initialFormState.otherAnswer,
  );
  const [hasSubmittedInvalidAnswer, setHasSubmittedInvalidAnswer] =
    React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const selectionMode = getSelectionMode(parameters);
  const isCards = shouldRenderAsCards(parameters, options);
  const isSubmittedState = visibleResult !== undefined;
  const isReadOnly = isSubmittedState || !respond;
  const isInteractionLocked = isReadOnly || isSubmitting;
  const isOtherSelected = selectedValues.includes(GET_USER_CHOICE_OTHER_VALUE);
  const isInvalid = isChoiceInvalid(parameters, selectedValues, otherAnswer);
  const showInvalid = hasSubmittedInvalidAnswer && isInvalid;
  const isSingleAllowOtherFlow =
    selectionMode === 'single' && Boolean(parameters.allowOther);
  const isInstantSubmitFlow =
    options.length > 0 &&
    selectionMode === 'single' &&
    !parameters.allowOther &&
    !isCards;
  const showSubmitButton =
    options.length > 0 &&
    (isSingleAllowOtherFlow ? isOtherSelected : !isInstantSubmitFlow);
  const showOtherSubmitButton = showSubmitButton && isOtherSelected;
  const showInlineSubmitButton =
    showSubmitButton && !isCards && !showOtherSubmitButton;
  const showCardsSubmitButton = showSubmitButton && isCards && !isOtherSelected;
  // const question = parameters.question?.trim();
  // const controlAccessibleLabel = question || 'Choose an option';
  const labelId = `${formId}-get-user-choice-label`;

  React.useEffect(() => {
    if (!isSubmittedState) {
      return;
    }

    setSelectedValues(initialFormState.selectedValues);
    setOtherAnswer(initialFormState.otherAnswer);
    setIsSubmitting(false);
  }, [initialFormState, isSubmittedState]);

  // if (!question && options.length === 0) {
  //   return null;
  // }

  if (options.length === 0) {
    return null;
  }

  const selectValue = (value: string) => {
    if (isInteractionLocked) {
      return;
    }

    if (selectionMode === 'multiple') {
      setSelectedValues((current) =>
        current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value],
      );
      return;
    }

    const nextValues = [value];
    setSelectedValues(nextValues);
    if (
      (isInstantSubmitFlow || isSingleAllowOtherFlow) &&
      value !== GET_USER_CHOICE_OTHER_VALUE
    ) {
      void submitWith(nextValues, otherAnswer);
    }
  };

  const clearOtherAnswer = () => {
    if (isInteractionLocked) {
      return;
    }
    setSelectedValues((current) =>
      current.filter((value) => value !== GET_USER_CHOICE_OTHER_VALUE),
    );
    setOtherAnswer('');
  };

  const submitWith = async (
    nextSelectedValues: string[],
    nextOtherAnswer: string,
  ) => {
    if (!respond || isSubmitting) {
      return;
    }
    if (isChoiceInvalid(parameters, nextSelectedValues, nextOtherAnswer)) {
      setHasSubmittedInvalidAnswer(true);
      return;
    }

    setHasSubmittedInvalidAnswer(false);
    setIsSubmitting(true);
    const nextResult = buildChoiceResult(
      parameters,
      options,
      nextSelectedValues,
      nextOtherAnswer,
    );
    setSubmittedResult(nextResult);
    try {
      await respond(nextResult);
    } catch (error) {
      setIsSubmitting(false);
      throw error;
    }
  };

  const handleSendClick = () => {
    if (isInvalid || isSubmitting) {
      setHasSubmittedInvalidAnswer(true);
      return;
    }
    void submitWith(selectedValues, otherAnswer);
  };

  return (
    <FieldGroup
      className={cn(
        getUserChoiceWrapperVariants({ size }),
        '@container-normal',
        isSubmitting && 'pointer-events-none',
      )}
    >
      <Field
        data-invalid={showInvalid || undefined}
        className={cn(getUserChoiceFieldVariants({ size }))}
      >
        {/* <FieldLabel
          id={labelId}
          className={cn(
            'w-full cursor-text opacity-100',
            getUserChoiceLabelVariants({ size, invalid: showInvalid }),
            !question && 'sr-only',
          )}
        >
          {question}
          {!question ? controlAccessibleLabel : null}
        </FieldLabel> */}

        {options.length > 0 && (
          <div
            role={selectionMode === 'single' ? 'radiogroup' : 'group'}
            aria-labelledby={labelId}
            aria-invalid={showInvalid || undefined}
            data-slot={
              selectionMode === 'single' ? 'radio-group' : 'checkbox-group'
            }
            className={cn(
              getUserChoiceGroupSpacing(size),
              isCards
                ? getUserChoiceCardsGroupClass
                : getUserChoiceChipsGroupClass,
            )}
          >
            {options.map((option) => (
              <ChoiceOptionButton
                key={option.value}
                option={option}
                selectionMode={selectionMode}
                isCards={isCards}
                isSelected={selectedValues.includes(option.value)}
                isReadOnly={isReadOnly}
                size={size}
                onSelect={selectValue}
              />
            ))}

            {parameters.allowOther && (
              <OtherOptionButton
                otherLabel={parameters.otherLabel}
                selectionMode={selectionMode}
                isCards={isCards}
                isSelected={isOtherSelected}
                isReadOnly={isReadOnly}
                size={size}
                onSelect={selectValue}
              />
            )}

            {showInlineSubmitButton && (
              <SendArrowButton
                size={size}
                label="Send"
                text={parameters.submitButtonText}
                disabled={isInteractionLocked || isInvalid}
                onClick={handleSendClick}
              />
            )}

            {showCardsSubmitButton && (
              <div
                className={cn(
                  'flex justify-start',
                  getUserChoiceCardsSubmitSpacing(size),
                )}
              >
                <SendArrowButton
                  size={size}
                  label="Send"
                  text={parameters.submitButtonText}
                  disabled={isInteractionLocked || isInvalid}
                  onClick={handleSendClick}
                />
              </div>
            )}
          </div>
        )}

        {isOtherSelected && (
          <OtherAnswerInput
            labelId={labelId}
            otherLabel={parameters.otherLabel}
            value={otherAnswer}
            isInvalid={showInvalid}
            isReadOnly={isReadOnly}
            size={size}
            submitButtonText={parameters.submitButtonText}
            showSubmitButton={showOtherSubmitButton}
            isSubmitDisabled={isInteractionLocked || isInvalid}
            onChange={(value) => {
              if (!isInteractionLocked) {
                setOtherAnswer(value);
              }
            }}
            onClear={clearOtherAnswer}
            onSubmit={handleSendClick}
          />
        )}
      </Field>

      {showSubmitButton &&
        !showInlineSubmitButton &&
        !showOtherSubmitButton &&
        !showCardsSubmitButton && (
          <div className={cn(getUserChoiceActionRowVariants({ size }))}>
            <SendArrowButton
              size={size}
              label="Send"
              text={parameters.submitButtonText}
              disabled={isInteractionLocked || isInvalid}
              onClick={handleSendClick}
            />
          </div>
        )}
    </FieldGroup>
  );
}

const parseGetUserChoiceToolResult = (
  result?: string,
): GetUserChoiceResult | undefined => {
  if (!result) {
    return undefined;
  }
  try {
    return JSON.parse(result) as GetUserChoiceResult;
  } catch {
    return undefined;
  }
};

export function GetUserChoiceToolResult({
  result,
  args,
  respond,
}: {
  result?: string;
  args: GetUserChoiceParameters;
  respond?: (result: unknown) => Promise<void>;
}) {
  const parsedResult = parseGetUserChoiceToolResult(result);
  const hasOptions = Array.isArray(args?.options) && args.options.length > 0;

  // if (!args?.question && !hasOptions) {
  //   return null;
  // }

  if (!hasOptions) {
    return null;
  }

  if (parsedResult?.status === 'skipped') {
    return <GetUserChoiceSkipped parameters={args} />;
  }

  return (
    <GetUserChoiceTool
      parameters={args}
      result={parsedResult}
      respond={respond}
    />
  );
}
