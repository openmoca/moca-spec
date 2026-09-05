# SCORM 2004 Augmentation Example

Demonstrates the education profile's `augmentation.targetType` convention
for legacy courseware
([education §5](../../profiles/education/moca-education-profile.md#5-sidecar-augmentation-for-courseware)),
built on top of the same core `augmentation` mechanism shown in
[../augmentation-generic](../augmentation-generic).

The AI Harness uses this sidecar to ground conversational tutoring and
GraphRAG-based Q&A against the legacy SCORM course content without modifying
the original package. No `raw/cs101-course.zip` is included in this
fixture — the manifest demonstrates the shape, not a runnable SCORM package.
