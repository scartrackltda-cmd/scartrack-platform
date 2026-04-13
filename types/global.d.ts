// Allow CSS file imports (used by mapbox-gl)
declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}

declare module "mapbox-gl/dist/mapbox-gl.css" {
  const content: Record<string, string>;
  export default content;
}
