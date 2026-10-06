import qrcode from "qrcode-generator"

export function qrMatrix(text: string): boolean[][] {
  // Type number 0 lets the encoder pick the smallest symbol that fits the text.
  const code = qrcode(0, "M")
  code.addData(text)
  code.make()
  const size = code.getModuleCount()
  return Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, col) => code.isDark(row, col)))
}
