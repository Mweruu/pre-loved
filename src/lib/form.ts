export interface FormState {
  error?: string | null;
  success?: string | null;
  demoCode?: string | null;
}

export const EMPTY_FORM_STATE: FormState = {
  error: null,
  success: null,
  demoCode: null,
};
