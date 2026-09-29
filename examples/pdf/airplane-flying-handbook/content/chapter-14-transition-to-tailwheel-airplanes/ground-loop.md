---
type: Document
title: Ground Loop
description: A ground loop is an uncontrolled turn during ground operations that may occur during taxi, takeoff, or during the after-landing roll. Ground loops start with a swerve that is allowed to continue for too long.
resource: https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/15_afh_ch14.pdf#page=8
sources:
  - id: pdf
    resource: https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/15_afh_ch14.pdf
    title: 'Chapter 14: Transition to Tailwheel Airplanes (PDF)'
moca:
  concepts:
    - iri: https://example.com/moca/pdf/airplane-flying-handbook#chapter-14-transition-to-tailwheel-airplanes/ground-loop
      role: primary
  evidence:
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=8
      note: p. 14-8
---
# Ground Loop

From Chapter 14: Transition to Tailwheel Airplanes, page 14-8 ([PDF](<https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/15_afh_ch14.pdf#page=8>)).

A ground loop is an uncontrolled turn during ground operations that may occur during taxi, takeoff, or during the after-landing roll. Ground loops start with a swerve that is allowed to continue for too long. The swerve may be the result of side-load on landing, a taxi turn started with too much groundspeed, overcorrection, or even an uneven ground surface or a soft spot that retards one main wheel of the airplane.

Due to the inbuilt instability of the tailwheel design, the forces that lead to a ground loop accumulate as the angle between the fuselage and inertia, acting from the CG, increase. If allowed to develop, these forces may become great enough to tip the airplane to the outside of the turn until one wing strikes the ground.

To counteract the possibility of an uncontrolled turn, the pilot should counter any swerve with firm rudder input. In stronger swerves, differential braking is essential as tailwheel steering proves inadequate. It is important to note, however, that as corrections begin to become apparent, rudder and braking inputs need to be removed promptly to avoid starting yet another departure in the opposite direction.
