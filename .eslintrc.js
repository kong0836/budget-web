module.exports = {
  root: true,
  env: {
    node: true
  },
  'extends': [
    'plugin:vue/essential',
    'eslint:recommended',
    '@vue/typescript/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules:  {
    // 生产环境下禁止 console，开发环境允许
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    // 生产环境下禁止 debugger，开发环境允许
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    // 关闭 Vue 组件名必须为多单词的检查
    'vue/multi-word-component-names': 'off',
    // TypeScript 未使用变量警告，忽略以下划线开头的参数
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // 关闭 Vue 单文件组件中 HTML 标签的换行检查
    'vue/html-closing-bracket-newline': ['error', {
      singleline: 'never',
      multiline: 'never'
    }],
    // HTML标签属性换行规则：属性≥3个时每个属性换行展示，否则建议在一行内展示
    'vue/max-attributes-per-line': ['error', {
      singleline: 2,  // 单行最多2个属性
      multiline: 1    // 多行时每行1个属性
    }],
    // 强制语句结尾使用分号
    'semi': ['error', 'always'],
    // 禁止不必要的分号
    'no-extra-semi': 'error',
    // 空格相关配置
    'object-curly-spacing': ['error', 'always'], // 对象字面量花括号内侧添加空格
    'array-bracket-spacing': ['error', 'never'], // 数组括号内侧不添加空格
    'comma-spacing': ['error', { before: false, after: true }], // 逗号后添加空格
    'space-in-parens': ['error', 'never'], // 括号内侧不添加空格
    'keyword-spacing': ['error', { before: true, after: true }], // 关键字前后添加空格
    'space-infix-ops': 'error', // 操作符周围添加空格
    'template-curly-spacing': ['error', 'never'], // 模板字符串花括号内侧不添加空格
    'space-before-function-paren': ['error', 'never'], // 函数括号前不添加空格
    '@typescript-eslint/no-explicit-any': 'off',  // 关闭 any 类型的检查
     'no-multiple-empty-lines': ['error', {
        max: 1,        // 最大连续空行数
        maxEOF: 1,     // 文件末尾最大空行数
        maxBOF: 0      // 文件开头最大空行数
    }],
   'no-trailing-spaces': ['error', {
      skipBlankLines: false,  // 是否跳过空行
      ignoreComments: false   // 是否忽略注释行
    }],
    // 'lines-between-class-members': ['error', 'always', {
    //   exceptAfterSingleLine: false
    // }],
      'padded-blocks': ['error', 'never'], // 禁止代码块内的多余空行
  }
};

