import path from 'node:path'

import {
  isAbsolute,
  createRule,
  moduleVisitor,
  makeOptionsSchema,
} from '../utils'
import type { ModuleOptions } from '../utils'

type MessageId = 'absolute'

export = createRule<[ModuleOptions?], MessageId>({
  name: 'no-absolute-path',
  meta: {
    type: 'suggestion',
    docs: {
      category: 'Static analysis',
      description: 'Forbid import of modules using absolute paths.',
    },
    fixable: 'code',
    schema: [makeOptionsSchema()],
    messages: {
      absolute: 'Do not import modules using an absolute path',
    },
  },
  defaultOptions: [],
  create(context) {
    const options = { esmodule: true, commonjs: true, ...context.options[0] }
    return moduleVisitor(source => {
      if (!isAbsolute(source.value)) {
        return
      }
      context.report({
        node: source,
        messageId: 'absolute',
        fix(fixer) {
          const resolvedContext = context.getPhysicalFilename
            ? context.getPhysicalFilename()
            : context.getFilename()
          // node.js and web imports work with posix style paths ("/")
          let relativePath = path.posix.relative(
            path.dirname(resolvedContext),
            source.value,
          )
          if (!relativePath.startsWith('.')) {
            relativePath = `./${relativePath}`
          }
          return fixer.replaceText(source, JSON.stringify(relativePath))
        },
      })
    }, options)
  },
})
