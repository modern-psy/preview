# Client-First checklist

- [ ] Названия читаемы, на английском и описывают purpose/relationship.
- [ ] Custom classes используют underscore; utilities — только hyphens.
- [ ] Нет BEM `__`/`--`, presentation-only, vague или generated names.
- [ ] Combo/state classes начинаются с `is-` и имеют base class.
- [ ] Wrapper имеет layout, scope, spacing или semantic responsibility.
- [ ] Semantic HTML и heading hierarchy не зависят от visual styling.
- [ ] Typography не использует `<br>` для обычного wrapping.
- [ ] Repeated sibling spacing выражен через `gap`, где это уместно.
- [ ] Content blocks fluid; фиксированные dimensions обоснованы.
- [ ] Raw values вынесены в semantic variables при реальном reuse.
- [ ] Utilities не получили несвязанные declarations.
- [ ] Нет ID styling, deep descendant chains и `!important`.
- [ ] Проверены default responsive bands и zoom/text scaling.
