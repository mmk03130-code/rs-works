// Maison Solenne — demo data. The owner edits this from admin.html (stored in the browser for the demo;
// the live build wires the same screens to a private backend, like our restaurant admin).
window.SOLENNE_DEFAULT = {
  settings: {
    brand: "MAISON SOLENNE",
    tagline: "Rings · Bespoke Watches · Leather Straps",
    city: "Washington",
    email: "atelier@maison-solenne.com",
    phone: "+1 (202) 555-0147",
    buyUrl: "https://checkout.example.com",
    heroTitle: "Objects for a lifetime, not a season.",
    heroSub: "Rings, bespoke watches and leather straps, made one at a time in our Washington atelier. Nothing here is made for stock."
  },
  lines: [
    { id: "rings", no: "01", name: "Rings", title: "A circle, closed by hand.",
      intro: "Every ring begins as a plain bar of metal. It is cut, bent, soldered and polished by one maker, start to finish — the same hands that will size it for you years from now.",
      wide: "rings-wide.jpg" },
    { id: "watches", no: "02", name: "Bespoke Watches", title: "Time, assembled by one pair of hands.",
      intro: "A Solenne watch is not picked from a shelf. Case, dial and movement are chosen with you, then assembled and regulated at a single bench. When it leaves, it carries the maker's mark inside the case back.",
      wide: "w1.jpg" },
    { id: "straps", no: "03", name: "Leather Straps", title: "The strap is not an accessory.",
      intro: "It is half of what you see and everything you feel. Our straps are cut from a single hide, saddle stitched with two needles and one thread, and finished with edges burnished by hand.",
      wide: "s2.jpg" }
  ],
  products: [
    { line: "rings", name: "Signet No. 1", material: "18k yellow gold, hand engraved", img: "r1.jpg" },
    { line: "rings", name: "The Solitaire Study", material: "Old mine cut diamond, recycled gold", img: "r2.jpg" },
    { line: "rings", name: "Band of Two Rivers", material: "Platinum over gold, matte finish", img: "r3.jpg" },
    { line: "rings", name: "The Closed Pair", material: "Matched wedding bands, made together", img: "r4.jpg" },
    { line: "watches", name: "Meridian Chronograph", material: "Steel case, black dial, stitched leather strap", img: "w1.jpg" },
    { line: "watches", name: "Sapphire Dial 38", material: "Blue lacquer dial, mesh bracelet", img: "w2.jpg" },
    { line: "watches", name: "Heritage Pocket Piece", material: "Gold case, exposed movement", img: "w3.jpg" },
    { line: "watches", name: "Noir 36", material: "Black dial, rose gold indices", img: "w4.jpg" },
    { line: "straps", name: "Velvet Noir", material: "Black calf, saddle stitched", img: "s1.jpg" },
    { line: "straps", name: "The Working Strap", material: "Bridle leather, ages with wear", img: "s2.jpg" },
    { line: "straps", name: "Tannery Brown", material: "Vegetable tanned, single hide", img: "s3.jpg" },
    { line: "straps", name: "Forest Calf", material: "Green calf, cream stitching", img: "s4.jpg" }
  ],
  steps: [
    { n: "1", t: "Select the hide", d: "One hide per strap, checked by hand for scars and stretch." },
    { n: "2", t: "Cut by hand", d: "No dies, no presses. A round knife and a straight edge." },
    { n: "3", t: "Skive the edges", d: "Thinned where it folds, so the strap sits flat on the wrist." },
    { n: "4", t: "Saddle stitch", d: "Two needles, one thread, crossed at every hole. It cannot unravel." },
    { n: "5", t: "Burnish", d: "Edges are heated, waxed and polished until they shine like glass." },
    { n: "6", t: "Rest and inspect", d: "A day of rest, then inspection under the loupe before it ships." }
  ]
};
