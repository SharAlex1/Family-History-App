import { Home, FileText, Heart, Baby, Skull, Plane, GraduationCap, Briefcase, Shield, Star, Globe, Camera, Mail, ScrollText, Newspaper } from "lucide-react";
import { C } from "./theme.js";

const TYPE = {
  birth:      { label: "Birth",      color: C.green,  Icon: Baby },
  death:      { label: "Death",      color: C.gray,   Icon: Skull },
  marriage:   { label: "Marriage",   color: C.rose,   Icon: Heart },
  migration:  { label: "Migration",  color: C.amber,  Icon: Plane },
  military:   { label: "Military",   color: C.sky,    Icon: Shield },
  education:  { label: "Education",  color: C.violet, Icon: GraduationCap },
  career:     { label: "Career",     color: C.sky,    Icon: Briefcase },
  residence:  { label: "Residence",  color: C.sub,    Icon: Home },
  milestone:  { label: "Milestone",  color: C.amber,  Icon: Star },
  document:   { label: "Document",   color: C.rose,   Icon: FileText },
  historical: { label: "Historical", color: C.faint,  Icon: Globe },
};

const DOC_TYPES = ["certificate", "record", "passport", "clipping", "photo", "letter", "audio", "video"];

const DOC_ICON = { certificate: ScrollText, record: FileText, passport: FileText, clipping: Newspaper, photo: Camera, letter: Mail, audio: Mail, video: Camera };

/* ------------------------------- HELPERS --------------------------------- */

export { TYPE, DOC_TYPES, DOC_ICON };
