import type { Project } from "@/types/sanity";

interface ProjectMetaProps {
  project: Project;
}

export default function ProjectMeta({ project }: ProjectMetaProps) {
  return (
    <dl className="space-y-4 font-sans text-sm">
      {project.year && (
        <div>
          <dt className="text-fg-muted uppercase tracking-widest text-xs mb-1">
            Year
          </dt>
          <dd className="text-fg">{project.year}</dd>
        </div>
      )}

      {project.location && (
        <div>
          <dt className="text-fg-muted uppercase tracking-widest text-xs mb-1">
            Location
          </dt>
          <dd className="text-fg">{project.location}</dd>
        </div>
      )}
    </dl>
  );
}
