const contactEmail = "serhiichyrva@hotmail.com";

export function ContactEmail() {
  return <a href={`mailto:${contactEmail}`}>{contactEmail}</a>;
}
