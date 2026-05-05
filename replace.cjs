const fs = require('fs')
const glob = require('glob')

const files = glob.sync('src/components/**/*.tsx')

files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8')

  // Replace base class rounded-md with rounded-2xl for labels containing 'cursor-pointer'
  content = content.replace(
    /'cursor-pointer rounded-md border px-3 py-2\.5 text-center transition duration-200',/g,
    "'cursor-pointer rounded-2xl border-2 px-3 py-3 text-center transition-all duration-150',",
  )

  // Also fix variants with flex items-center inside
  content = content.replace(
    /'cursor-pointer rounded-md border px-4 py-3 sm:px-6 sm:py-4 transition duration-200',/g,
    "'cursor-pointer rounded-2xl border-2 px-4 py-3 sm:px-6 sm:py-4 transition-all duration-150',",
  )

  // Selected state
  content = content.replace(
    /'border-\[#6c1834\] bg-gradient-to-b from-\[#a33a4a\] to-\[#7e1f3d\] text-white shadow-\[0_12px_28px_-16px_rgba\(126,31,61,0\.62\)\]'/g,
    "'border-[var(--love-900)] border-b-4 bg-[var(--love-700)] text-white active:border-b-2 active:translate-y-[2px]'",
  )

  // Selected state (ActivitySearchModeField doesn't have exact same selected state, might be same)
  // Let's do regex for the from-[...] to-[...]
  content = content.replace(
    /'border-\[#6c1834\] bg-gradient-to-br from-\[#a33a4a\] to-\[#7e1f3d\] text-white shadow-\[0_12px_28px_-16px_rgba\(126,31,61,0\.62\)\]'/g,
    "'border-[var(--love-900)] border-b-4 bg-[var(--love-700)] text-white active:border-b-2 active:translate-y-[2px]'",
  )

  // Unselected state
  content = content.replace(
    /'border-\[var\(--ui-border\)\] bg-\[var\(--ui-surface\)\] text-\[var\(--ui-text\)\] hover:-translate-y-0\.5 hover:border-\[var\(--love-300\)\] hover:bg-\[var\(--ui-surface-soft\)\]'/g,
    "'border-[var(--ui-border)] border-b-4 bg-[var(--ui-surface)] text-[var(--ui-text)] hover:bg-[var(--ui-surface-soft)] active:border-b-2 active:translate-y-[2px]'",
  )

  // Field label class names might need update, but we focus on buttons/chips here.

  fs.writeFileSync(file, content)
})

console.log('Done!')
