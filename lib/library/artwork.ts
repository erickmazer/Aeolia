// Capas do iTunes vêm em 60×60 (artworkUrl60). A URL embute o tamanho
// (`.../60x60bb.jpg`), então dá pra pedir uma resolução maior trocando o token.
// Se o padrão não bater (outra fonte), devolve a URL original intacta.
export function artworkHiRes(url: string, size = 200): string {
  return url.replace(/\/\d+x\d+bb\./, `/${size}x${size}bb.`)
}
