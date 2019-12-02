# The architecture

This is an overview of the architecture. When analyzing a file, the analyzer goes through these steps using `flavors` to find components and features.

<img src="https://user-images.githubusercontent.com/5372940/69460288-09342080-0d74-11ea-822e-2194f986115d.png" />

# Flavors

Each flavor finds features on components. Features can be "properties", "attributes", "slot", eg. Flavors can be toggled on/off, but all are run as default.

# Analyzing and Merging

Multiple features can be emitted per property (eg. if you have both a constructor assignment and a class field that reference the same property). Here are some highlights of feature merging.

**Highlights:**

- Each feature emitted is emitted with a priority (low, medium, high)
- Features are sorted and merged from highest to lowest priority
- For example, properties found in the constructor are "low" priority and class fields are "high" priority
- A given field on a feature (such as `required`) prefers the value of the first non-undefined value found (after priority-sort)
- In TS-file the type checker is preferred over the `@type` JSDoc. In JS-file the `@type` JSDoc is preferred over the type checker
- In TS-file constructor assignments are not checked (this is more aligned with what Typescript does)
- An attribute with same name as a property is always connected to the property (this might however be unwanted behavior in some cases)
