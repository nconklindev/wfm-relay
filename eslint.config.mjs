// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import prettier from 'eslint-config-prettier'

export default withNuxt(
  {
    rules: {
      // ---- Vue: SFC structure ----
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/block-order': ['error', { order: ['script', 'template'] }],
      'vue/define-macros-order': [
        'error',
        { order: ['defineOptions', 'defineProps', 'defineEmits', 'defineSlots'] },
      ],
      // Enforce consistent macro variable names
      'vue/require-macro-variable-name': [
        'error',
        { defineProps: 'props', defineEmits: 'emit', defineSlots: 'slots' },
      ],
      // Enforce defineOptions() instead of a second <script> block
      'vue/prefer-define-options': 'error',

      // ---- Vue: TypeScript-first declarations ----
      // Enforce defineProps<{ ... }>() — matches existing code style
      'vue/define-props-declaration': ['error', 'type-based'],
      // Enforce defineEmits<{ ... }>() — matches existing code style
      'vue/define-emits-declaration': ['error', 'type-based'],
      // Enforce ref<Type>() when type cannot be inferred (e.g. ref(null))
      'vue/require-typed-ref': 'error',

      // ---- Vue: Reactivity correctness ----
      // Catches destructuring a ref/reactive in ways that lose reactivity
      'vue/no-ref-object-reactivity-loss': 'error',
      // Catches reading props directly in setup (const x = props.val)
      'vue/no-setup-props-reactivity-loss': 'error',

      // ---- Vue: Template cleanliness ----
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/custom-event-name-casing': ['error', 'camelCase'],
      'vue/v-for-delimiter-style': ['error', 'in'],
      'vue/no-useless-v-bind': 'error',
      'vue/no-useless-mustaches': 'error',
      'vue/prefer-true-attribute-shorthand': 'warn',
      'vue/prefer-separate-static-class': 'warn',
      // Allow != null / == null (catches both null and undefined — intentional idiom)
      'vue/eqeqeq': ['error', 'always', { null: 'ignore' }],

      // ---- Vue: Unused code ----
      'vue/no-unused-vars': 'error',
      'vue/no-unused-refs': 'warn',
      'vue/no-unused-emit-declarations': 'warn',

      // ---- Vue: Security ----
      'vue/no-v-html': 'error',
      'vue/no-template-target-blank': 'error',

      // ---- Vue: Accessibility ----
      // Requires explicit type="button|submit|reset" on <button> elements
      'vue/html-button-has-type': 'warn',

      // ---- TypeScript ----
      // Prefer interface over type for object shapes (extendable, better errors)
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      // Enforce property-style signatures (stricter variance in strict mode)
      '@typescript-eslint/method-signature-style': ['error', 'property'],
      // Catch variable shadowing across scopes
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',

      // ---- JavaScript ----
      // Allow != null / == null (catches both null and undefined — intentional idiom)
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-alert': 'error',

      // ---- Formatting: disable rules not covered by eslint-config-prettier ----
      'vue/first-attribute-linebreak': 'off',
    },
  },
  {
    // shadcn-nuxt generates UI components with different conventions
    files: ['app/components/ui/**/*.vue'],
    rules: {
      'vue/require-macro-variable-name': 'off',
      'vue/no-setup-props-reactivity-loss': 'off',
      'vue/require-default-prop': 'off',
    },
  },
  prettier, // must be last — disables all ESLint formatting rules that conflict with Prettier
)
