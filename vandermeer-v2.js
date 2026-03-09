// ═══════════════════════════════════════════════════════════
// CONTENT PACKAGE — THE VANDERMEER JOB
// The Alderton Museum Gala · The Vandermeer Sapphire
// ═══════════════════════════════════════════════════════════

window.HEIST_CONTENT = {

  // ── IDENTITY ─────────────────────────────────────────────

  id: 'vandermeer',
  title: 'THE HEIST',
  eyebrow: 'Museum Gala · One Night · Four People',
  subtitle: "The Vandermeer Sapphire. The Alderton Museum. The plan is good. Trust everyone until you can't.",

  crew: [
    { name: 'Vale', role: 'comms & timing' },
    { name: 'Nix',  role: 'social & disguise' },
    { name: 'Rook', role: 'routes & infrastructure' },
  ],

  // ── TARGET STATES ────────────────────────────────────────
  // Engine tracks target state as an opaque key.
  // Content supplies the display strings and success keys.

  target: {
    initial: 'not_secured',
    displayStrings: {
      not_secured: 'Target: Not Secured',
      secured:     'Target: Secured',
      transferred: 'Target: Transferred',
      lost:        'Target: Lost',
    },
    // Keys that count as successful extraction
    successKeys: ['secured', 'transferred'],
    // CSS modifier classes for HUD display
    hudClasses: {
      not_secured: '',
      secured:     'secured',
      transferred: 'transferred',
      lost:        'lost',
    },
  },

  // ── PLAN LINE LABEL ──────────────────────────────────────
  // The label shown above the plan line in each scene.
  // Remove "Vale" here if another heist uses a different comms voice.

  planLineLabel: 'Vale — Plan',

  // ── WINDOW URGENCY LINE ──────────────────────────────────
  // Appended to the plan line text when window < urgency threshold.

  windowUrgencyLine: 'The window is closing.',

  // ── PLAN SCREEN ──────────────────────────────────────────

  planPhase: 'Phase One',
  planTitle: 'The Plan',
  planBrief: 'The Vandermeer Sapphire is on display tonight. The access codes reset at midnight. Commit your approach before the doors open.',

  planCategories: [
    {
      key: 'entry',
      label: 'Entry Approach',
      options: [
        { value: 'Front Social',        name: 'Front Social',        desc: 'Donor credentials. Walk through the front. The gala is the cover.' },
        { value: 'Service Route',       name: 'Service Route',       desc: 'Back corridors and freight access. Invisible to the floor. Rook mapped it Thursday.' },
        { value: 'Staff Impersonation', name: 'Staff Impersonation', desc: 'Vendor uniform and a forged credential. Authority by category.' },
      ],
    },
    {
      key: 'grab',
      label: 'Grab Style',
      options: [
        { value: 'Fast Snatch',     name: 'Fast Snatch',     desc: 'Take the stone and move. No swap, no transfer. Exposure is the cost.' },
        { value: 'Clean Swap',      name: 'Clean Swap',      desc: 'Replace with a prepared replica. Nobody knows until someone looks closely.' },
        { value: 'Hidden Transfer', name: 'Hidden Transfer', desc: 'Stone moves off your body immediately. Nix carries it out separately.' },
      ],
    },
    {
      key: 'contingency',
      label: 'Contingency',
      options: [
        { value: 'Inside Blue', name: 'Inside Blue', desc: 'A planted contact in museum security. Active only if the plan breaks entirely.' },
        { value: 'Lights Out',  name: 'Lights Out',  desc: 'Rook cuts power on signal. Thirty seconds of controlled darkness.' },
        { value: 'Decoy Case',  name: 'Decoy Case',  desc: 'A prepared duplicate transport case. Buys time and confusion if you\'re caught.' },
      ],
    },
  ],

  // ── BETRAYAL CONFIG ──────────────────────────────────────

  betrayal: {
    probability: 0.33,
    betrayerName: 'ROOK',
    // Scene indices where betrayer goes silent on comms
    silentScenes: [2, 3, 4],
    // Scene index at which betrayal fires (vault transfer)
    fireScene: 4,
    // Scene keys that are eligible to fire the betrayal
    fireSceneKeys: ['vault_timing_clean','vault_timing_comp','vault_transfer_clean','vault_transfer_comp'],
    revealHead: 'Rook — Signal Lost',
    revealBody: "The alarm kill was called. The alarm is still live.\n\nRook comes back on comms forty seconds later. His voice is controlled. He says he's sorry. He says he didn't have a choice. He says the name of a person you don't recognize and asks you to understand.\n\nYou don't have time to understand. You move.",
    deltaModifier: { heat: 15, ctrl: -10, window: -15 },
  },

  // ── DELTA MODIFIER PIPELINE ──────────────────────────────
  // Called after base scene deltas are computed.
  // Returns a delta patch object to be merged. Return {} for no change.
  // Keeps all grab-style modifier logic out of the engine.

  applyRunModifiers(baseDeltas, sceneIdx, plan, state) {
    let patch = {};

    // Fast Snatch: lower heat tolerance means extra heat in Act 4+ (scenes 5+)
    if(plan.grab === 'Fast Snatch' && sceneIdx >= 5) {
      patch.heat = (patch.heat || 0) + 5;
    }

    // Clean Swap: suppresses heat in Act 4 crisis scene (index 5)
    if(plan.grab === 'Clean Swap' && sceneIdx === 5) {
      patch.heat = (patch.heat || 0) - 10;
    }

    // Clean Swap: discovery spike at exit if window already low
    if(plan.grab === 'Clean Swap' && sceneIdx >= 7 && state.window < 25) {
      patch.heat = (patch.heat || 0) + 18;
    }

    return patch;
  },

  // ── CONTINGENCY REVEAL ───────────────────────────────────
  // Called by engine after resolution if scene is a reversal.
  // Returns { head, body } if contingency fires, or null.
  // This is where Inside Blue lives — not in the engine.

  checkContingencyReveal(plan, cmd, quality) {
    if(
      plan.contingency === 'Inside Blue' &&
      ['Hold Nerve', 'Signal', 'Trust the Plan'].includes(cmd) &&
      quality >= 1
    ) {
      return {
        head: 'Inside Blue — Contingency Active',
        body: "The backup guard makes a gesture — one flat hand, palm down, pressed once. You've seen that signal before. Rook taught it to you three weeks ago in a parking structure in Brussels.\n\nThe apparent arrest becomes something else entirely.",
      };
    }
    return null;
  },

  // ── POKER BEAT VOCABULARY ────────────────────────────────
  // Called by engine after poker resolution.
  // Returns a short atmospheric line or empty string.
  // Owns all character-specific language (Vale, Rook).

  pokerBeatLine(tier, sceneCat, isReversal, isVault, quality, state) {
    const runBad   = state.heat > 55 || state.ctrl < 40 || state.planVal < 40;
    const runClean = state.heat < 25 && state.ctrl > 70 && state.planVal > 70;

    if(tier >= 7) {
      if(isReversal) return "The hand was extraordinary. The kind of luck that doesn't announce itself — it simply arrives, exactly when it has to.";
      if(isVault)    return 'The cards came exactly right. Vale would say the plan earned it. You know better.';
      return "A hand like that only happens when you stop expecting it.";
    }
    if(tier >= 5) {
      if(isReversal && runBad) return 'The cards were better than the situation deserved. You used them.';
      if(isReversal)  return 'The hand held. So did you.';
      if(isVault)     return "Everything aligned at once — the timing, the hand, the moment. It won't always.";
      return runClean ? 'The operation and the hand agreed with each other.' : 'The cards were kinder than the evening.';
    }
    if(tier >= 3) {
      if(isReversal) return 'Not perfect. Enough.';
      if(runBad)     return 'A workable hand in an unworkable situation. You take what you get.';
      return '';
    }
    if(tier >= 1) {
      if(isReversal && runBad) return 'A thin hand. You played it anyway. The alternative was worse.';
      if(isVault)    return 'The hand was ordinary. The moment was not.';
      return '';
    }
    // High card
    if(isReversal) {
      return runBad
        ? 'High card. The worst possible hand at the worst possible moment. You felt it.'
        : 'High card. The hand gave you nothing. The rest was yours to manage.';
    }
    if(isVault && quality <= 0) return 'Nothing in the hand to help. You went anyway.';
    return '';
  },

  // ── ENDING CONFIG ────────────────────────────────────────

  endings: {
    // Verdicts checked in order — first match wins.
    // endState keys: success, clean, controlled, planIntact, windowOk,
    //   windowNearMiss, contingencyFired, betrayalActive, betrayalRevealed,
    //   grab, compCount, managedWell, reversalBeat, reversalGood,
    //   reversalPerfect, exceptionalHands, exceptionalAtReversal
    verdicts: [
      {
        id: 'plan_within_plan',
        check: (s) => s.success && s.contingencyFired && s.clean && s.planIntact,
        verdict: 'The Plan Within the Plan',
        sub: 'Every contingency held. Even the one nobody saw coming.',
        cls: 'success',
      },
      {
        id: 'extracted',
        check: (s) => s.success && s.clean && s.controlled && s.planIntact && s.windowOk && !s.betrayalRevealed,
        verdict: 'Extracted',
        sub: 'Clean hands. No trace. The sapphire is gone.',
        cls: 'success',
      },
      {
        id: 'extracted_cost',
        check: (s) => s.success && s.betrayalRevealed && s.controlled,
        verdict: 'Extracted — At a Cost',
        sub: 'The stone moved. So did trust.',
        cls: 'partial',
      },
      {
        id: 'fast_quiet',
        check: (s) => s.success && s.grab === 'Fast Snatch' && s.clean,
        verdict: 'Fast and Quiet',
        sub: 'Nerve over elegance. It held.',
        cls: 'success',
      },
      {
        id: 'clean_hands',
        check: (s) => s.success && s.grab === 'Hidden Transfer' && s.clean,
        verdict: 'Clean Hands',
        sub: 'You walked out with nothing. That was the point.',
        cls: 'success',
      },
      {
        id: 'compromised',
        check: (s) => s.success && (!s.clean || !s.controlled),
        verdict: 'Compromised',
        sub: 'The stone moved. So did a great deal of attention.',
        cls: 'partial',
      },
      {
        id: 'survived',
        check: (s) => s.success,
        verdict: 'Survived',
        sub: "It worked. Not the way it was drawn up, but it worked.",
        cls: 'partial',
      },
      {
        id: 'burned',
        check: () => true,
        verdict: 'Burned',
        sub: 'The sapphire stays where it was.',
        cls: 'failure',
      },
    ],

    // Debrief line generators — each returns a string or null.
    debriefLines: [
      // Complication shape
      (s) => {
        if(s.compCount === 0) return 'The museum cooperated. No environmental complications materialized. A run like this one rewards preparation more than improvisation.';
        if(s.compCount >= 2 && s.managedWell >= 2) return 'Two complications. Both managed. The operation absorbed pressure and kept moving — which is the difference between a plan and a wish.';
        if(s.compCount >= 1 && s.managedWell === 0) return 'The complications cost more than they should have. The operation adapted but spent resources it needed later.';
        return `${s.compCount === 1 ? 'One complication' : 'Two complications'}, handled at varying cost. The evening was not what was drawn up.`;
      },
      // Grab style
      (s) => {
        if(s.grab === 'Fast Snatch') {
          if(s.success && s.clean) return 'The Fast Snatch meant the stone was on you from the vault to the street. Every moment after the case opened was a moment of exposure. You held your nerve through all of them.';
          if(s.success) return 'The Fast Snatch kept the stone on you longer than was comfortable. The heat reflects it. The operation succeeded despite the exposure.';
          return 'The Fast Snatch left no room for complications. The stone was on you and the room eventually noticed.';
        }
        if(s.grab === 'Clean Swap') {
          if(s.windowNearMiss) return "The Clean Swap bought time — but the window nearly expired before you were out. The replica was still in the case when the corridor behind you got complicated. You felt the discovery starting as you left.";
          if(s.success) return 'The Clean Swap worked as designed. The museum will not know what it is missing until someone looks closely at what remains. You were well clear before that happened.';
          return 'The Clean Swap was undone before it could work. The replica was irrelevant once the window closed.';
        }
        if(s.grab === 'Hidden Transfer') {
          if(s.success) return "The Hidden Transfer meant the stone was Nix's problem from the moment you left the vault. You walked out clean. That is a specific kind of trust — handing the whole operation to someone else and walking in the opposite direction.";
          return 'The Hidden Transfer distributed the risk but could not distribute the outcome. The stone did not make it.';
        }
        return null;
      },
      // Betrayal
      (s) => {
        if(s.betrayalActive && s.betrayalRevealed) return "Rook was running the timing against you. Not the intelligence — the intelligence was accurate. But the pace was his, and the pace was wrong on purpose. The alarm that did not kill was the moment it became undeniable.";
        if(s.betrayalActive && !s.betrayalRevealed) return "Something in the window did not add up. The timing across Acts two and three was tighter than Rook's map should have allowed. You noticed it as a feeling. You did not know what to do with the feeling.";
        return null;
      },
      // Reversal
      (s) => {
        if(!s.reversalBeat) return null;
        if(s.contingencyFired) return 'The contingency worked the way contingencies are supposed to — invisibly, until the moment it mattered entirely.';
        if(s.reversalPerfect) return 'The reversal was the hardest moment and you played it correctly. That does not happen by accident.';
        if(s.reversalGood) return 'The reversal was survivable. Not clean. Survivable. That distinction will matter going forward.';
        if(s.success) return 'The reversal nearly ended the operation. You got through it. The margin was not something you would want to replicate.';
        return null;
      },
      // Window near-miss
      (s) => {
        if(s.windowNearMiss && !s.betrayalRevealed) return 'The access codes were close to cycling when you reached the vault. The plan assumed more time than the evening allowed. Vale noticed.';
        return null;
      },
      // Exceptional poker
      (s) => {
        if(s.exceptionalAtReversal) return `A ${s.exceptionalAtReversal.pokerName} at the reversal. The hand had no reason to be that good. Sometimes an operation is saved by something nobody planned.`;
        if(s.exceptionalHands && s.exceptionalHands.length > 0 && s.success) return 'The cards ran well at a critical moment. Not every operation gets that.';
        return null;
      },
      // Final line
      (s) => {
        if(s.success && s.planIntact && s.clean) return 'Vale would call it professional. She would be right.';
        if(s.success && !s.planIntact) return 'The plan did not hold. The crew did. Those are different things and both matter.';
        if(!s.success) return 'The sapphire is still in the museum. The next attempt, if there is one, starts with less than this one did.';
        return null;
      },
    ],

    // CSS class for each debrief line.
    debriefLineClass: (line, idx, s) => {
      if(idx > 0 && s.betrayalActive && s.betrayalRevealed && line.includes('Rook')) return 'debrief-line rook-line';
      if(line.includes(s.grab)) return 'debrief-line grab-line';
      return 'debrief-line';
    },
  },

  // ── RUN STRUCTURE ────────────────────────────────────────
  // Provides scene pool selection only — NOT run structure logic.
  // Engine calls buildRunStructure() using this map.
  // Format: { actIndex: { clean: 'key', comp: 'key' } }
  // Special keys 'reversal' and null (exit) are handled by the engine.

  actScenes: [
    // Act 0 — Entry (single scene, determined by plan.entry)
    {
      clean: (plan) => {
        if(plan.entry === 'Front Social')        return 'entry_social_clean';
        if(plan.entry === 'Service Route')       return 'entry_service_clean';
        return 'entry_staff_clean';
      },
      comp: (plan) => {
        if(plan.entry === 'Front Social')        return 'entry_social_comp';
        if(plan.entry === 'Service Route')       return 'entry_service_comp';
        return 'entry_staff_comp';
      },
    },
    // Act 1 — Approach (two scenes)
    { clean: () => 'approach_movement_clean', comp: () => 'approach_movement_comp' },
    { clean: () => 'approach_timing_clean',   comp: () => 'approach_timing_comp'   },
    // Act 2 — Vault (two scenes, share comp slot)
    { clean: () => 'vault_timing_clean',      comp: () => 'vault_timing_comp',   actSlot: 2 },
    { clean: () => 'vault_transfer_clean',    comp: () => 'vault_transfer_comp', actSlot: 2 },
    // Act 3 — Crisis (one scene)
    { clean: () => 'crisis_heat_clean',       comp: () => 'crisis_heat_comp' },
  ],

  // ── SCENE POOL ───────────────────────────────────────────

  scenes: {

    // ── ACT 1: ENTRY ─────────────────────────────────────

    entry_social_clean: {
      cat: 'social', act: 'Act I — Entry',
      isComplication: false,
      title: 'Front Entrance — Donor Registration',
      body: "The gala is in full effect. Two hundred guests, a string quartet, waitstaff moving with the particular efficiency of people being watched by their supervisors. The credential desk is staffed by two volunteers and one security officer. The line is short.",
      comms: () => [
        { who: 'NIX',  line: "Collar up slightly. You're a late arrival — someone who almost didn't come. That's the energy. Not eager. Slightly inconvenienced." },
        { who: 'VALE', line: 'Credential scans clean. Move past the desk before the officer has a reason to look at your face.' },
      ],
      planLine: (p) => 'Plan says: donor credentials are solid. Walk through. Let them do the work.',
      planBonus: (cmd) => ['Commit','Charm','Sell the Pause','Hold Nerve'].includes(cmd) ? 1 : ['Improvise','False Panic','Burn Disguise'].includes(cmd) ? -1 : 0,
      table: [{ r:'Q', s:'♦', cmd:'Donor Floor' }, { r:'8', s:'♥', cmd:'Credential Check' }],
      narrative: (q, cmd) => {
        if(q >= 4) return "The credential scans. The officer nods. You move past the desk at the pace of someone who has been to enough of these that the novelty has worn off. Nix was right about the energy.";
        if(q >= 2) return `You ${cmd.toLowerCase()} — the credential passes, the officer makes eye contact for one beat. You hold it without blinking. He looks at the next guest.`;
        return `The ${cmd.toLowerCase()} creates a small friction. The volunteer asks you to step aside briefly. Nix appears from somewhere, makes a remark about the canapés, and the moment dissolves.`;
      },
      deltas: (q) => ({ plan: q>=3?0:q>=1?-5:-15, heat: q>=3?5:q>=1?12:25, ctrl: q>=3?0:q>=1?0:-8, window: q>=3?-5:q>=1?-8:-14 }),
    },

    entry_social_comp: {
      cat: 'social', act: 'Act I — Entry',
      isComplication: true,
      title: 'Front Entrance — The Board Member',
      body: "The credential desk is normal. The problem is standing beside it: a museum board member, someone whose face is in the annual report, who apparently knows the donor whose credentials you're carrying. He has already seen you.",
      comms: () => [
        { who: 'NIX',  line: "He's walking over. He thinks he knows you — or he thinks he should. Let him believe whichever version is easier." },
        { who: 'VALE', line: 'You have about fifteen seconds before he reaches you. Do not leave the desk before your credential clears.' },
      ],
      planLine: (p) => 'Plan says: donor credentials, front entrance, straight through.',
      planBonus: (cmd) => ['Charm','Sell the Pause','Commit','Bluff'].includes(cmd) ? 1 : ['Improvise','False Panic','Press Forward'].includes(cmd) ? -1 : 0,
      table: [{ r:'K', s:'♦', cmd:'Board Member' }, { r:'8', s:'♥', cmd:'Credential Clearing' }],
      narrative: (q, cmd) => {
        if(q >= 4) return `You ${cmd.toLowerCase()} — become exactly the person he expects to see. He shakes your hand and says something about the last fundraiser. You agree. The credential clears. The conversation ends naturally.`;
        if(q >= 2) return `You ${cmd.toLowerCase()}. He's warm but uncertain — he can't quite place you. You give him enough to satisfy the uncertainty and the credential clears while he's thinking about it.`;
        return `The ${cmd.toLowerCase()} confirms his confusion. He asks a direct question you can't answer. Vale feeds something through the earpiece. You say it. He accepts it, but the credential desk officer is now watching.`;
      },
      deltas: (q) => ({ plan: q>=3?0:q>=1?-8:-20, heat: q>=3?10:q>=1?20:38, ctrl: q>=3?0:q>=1?-5:-15, window: q>=3?-6:q>=1?-12:-20 }),
    },

    entry_service_clean: {
      cat: 'movement', act: 'Act I — Entry',
      isComplication: false,
      title: 'Loading Bay — Service Entrance',
      body: "The service entrance is exactly where Rook said it would be. Badge reader on the right, camera covering the approach, a fourteen-second window between sweeps. The corridor beyond it runs straight to the back-of-house stairwell.",
      comms: () => [
        { who: 'ROOK', line: "Badge reads on first pass. Don't linger at the reader. Right wall, keep moving." },
        { who: 'VALE', line: 'Camera sweeps back in fourteen. You have eight seconds from the reader to the first corner.' },
      ],
      planLine: (p) => 'Plan says: right wall, first touch, no stopping. The route is clear.',
      planBonus: (cmd) => ['Slip Past',"Rook's Route",'Trust the Plan','Hold Nerve'].includes(cmd) ? 1 : ['Stall','Bluff'].includes(cmd) ? -1 : 0,
      table: [{ r:'7', s:'♠', cmd:'Badge Reader' }, { r:'9', s:'♣', cmd:'Eight Minutes' }],
      narrative: (q, cmd) => {
        if(q >= 4) return "First touch. The badge reads clean. You take the right wall at exactly the pace of someone who has done this before. Rook was right about the camera.";
        if(q >= 2) return `You ${cmd.toLowerCase()} — the reader takes two attempts. The corridor is clear. Six minutes left in the window.`;
        return `The ${cmd.toLowerCase()} stalls you at the reader. A kitchen porter appears at the far end of the corridor before you're through. He says nothing. You don't know why.`;
      },
      deltas: (q) => ({ plan: q>=3?0:q>=1?-5:-15, heat: q>=3?0:q>=1?8:20, ctrl: q>=3?5:q>=1?0:-12, window: q>=3?-5:q>=1?-8:-15 }),
    },

    entry_service_comp: {
      cat: 'movement', act: 'Act I — Entry',
      isComplication: true,
      title: 'Loading Bay — Someone Changed the Schedule',
      body: "The service entrance is correct. The badge reader is correct. The corridor is not. A catering truck is backed into the bay forty minutes ahead of schedule, and two staff members are unloading it directly across your route. Rook's map is accurate. The map just doesn't account for this.",
      comms: () => [
        { who: 'ROOK', line: "They moved the delivery up. I don't know why. The corridor is passable but not clean. You'll need to move through them, not around them." },
        { who: 'VALE', line: 'Four minutes before the credential window closes. You have options. Not many.' },
      ],
      planLine: (p) => 'Plan says: service entry, right wall, first touch. The route is clear.',
      planBonus: (cmd) => ['Slip Past','Charm','Fold Cover','Hold Nerve'].includes(cmd) ? 1 : ['Stall','Improvise','Bluff'].includes(cmd) ? -1 : 0,
      table: [{ r:'5', s:'♠', cmd:'Route Blocked' }, { r:'9', s:'♣', cmd:'Four Minutes' }],
      narrative: (q, cmd) => {
        if(q >= 4) return `You ${cmd.toLowerCase()} — through the catering staff at exactly the pace of someone who belongs here, carrying something, going somewhere. Neither of them looks up.`;
        if(q >= 2) return `You ${cmd.toLowerCase()}. One of the staff members asks if you need a hand. You say no, keep moving. He watches you go. He doesn't follow.`;
        return `The ${cmd.toLowerCase()} creates confusion. One of the staff members blocks your path without meaning to. You route around him, losing a minute and entering the corridor from the wrong angle.`;
      },
      deltas: (q) => ({ plan: q>=3?-3:q>=1?-10:-20, heat: q>=3?5:q>=1?15:28, ctrl: q>=3?0:q>=1?-8:-18, window: q>=3?-8:q>=1?-14:-22 }),
    },

    entry_staff_clean: {
      cat: 'social', act: 'Act I — Entry',
      isComplication: false,
      title: 'Staff Entrance — Clipboard and Tone',
      body: "The staff entrance runs alongside the catering corridor. A security officer with a scanner. Nix fitted the uniform this afternoon. The clipboard is real. The name on it is not.",
      comms: () => [
        { who: 'NIX',  line: "Collar straight. Clipboard forward. You're running a vendor compliance check. Move like you're already late for the next one." },
        { who: 'VALE', line: "Scanner reads the credential. Hold it naturally — long enough to look normal, short enough not to get memorized." },
      ],
      planLine: (p) => 'Plan says: authority is the access. Own the corridor.',
      planBonus: (cmd) => ['Commit','Bluff','Hold Nerve','Charm'].includes(cmd) ? 1 : ['Stall','Improvise'].includes(cmd) ? -1 : 0,
      table: [{ r:'J', s:'♠', cmd:'Scanner Active' }, { r:'6', s:'♦', cmd:'Uniform Fits' }],
      narrative: (q, cmd) => {
        if(q >= 4) return "The scanner reads. The officer nods. You walk past him at precisely the pace of someone who has done this before, which is the pace that makes you invisible.";
        if(q >= 2) return `You ${cmd.toLowerCase()} — the scanner passes, the officer hesitates one second, then steps aside. One second is manageable.`;
        return `The ${cmd.toLowerCase()} creates friction. He asks you to wait. Vale feeds a name through the earpiece. You say it. He lets you through. Heat is up.`;
      },
      deltas: (q) => ({ plan: q>=3?0:q>=1?-5:-10, heat: q>=3?5:q>=1?12:25, ctrl: q>=3?0:q>=1?0:-8, window: q>=3?-5:q>=1?-8:-14 }),
    },

    entry_staff_comp: {
      cat: 'social', act: 'Act I — Entry',
      isComplication: true,
      title: 'Staff Entrance — The Supervisor Is Watching',
      body: "The staff entrance is correct. The uniform is correct. The problem is the security supervisor, who is standing beside the officer running the scanner and personally reviewing every credential tonight. He wasn't scheduled. Something changed.",
      comms: () => [
        { who: 'NIX',  line: "He's the head of floor security. Ex-police. He looks at faces, not badges. Do not give him a reason to look twice." },
        { who: 'VALE', line: "Your credential will pass. Your face needs to pass too. Nix can create a distraction but it costs him his position." },
      ],
      planLine: (p) => 'Plan says: staff credentials, scanner pass, straight through. Authority is the access.',
      planBonus: (cmd) => ['Charm','Commit','Sell the Pause','Hold Nerve'].includes(cmd) ? 1 : ['Improvise','False Panic','Burn Disguise'].includes(cmd) ? -1 : 0,
      table: [{ r:'K', s:'♠', cmd:'Supervisor Present' }, { r:'J', s:'♦', cmd:'Scrutiny' }],
      narrative: (q, cmd) => {
        if(q >= 4) return `You ${cmd.toLowerCase()} — measured, unhurried, the mild professional patience of someone waiting for a formality to complete. The supervisor glances at you and looks away. He's already thinking about the next person in line.`;
        if(q >= 2) return `You ${cmd.toLowerCase()}. The supervisor holds the credential slightly longer than necessary. Then he hands it back. He will remember your face.`;
        return `The ${cmd.toLowerCase()} creates exactly the wrong impression. The supervisor steps forward personally. Nix deploys the distraction. It works, but the entry is now flagged in the supervisor's attention.`;
      },
      deltas: (q) => ({ plan: q>=3?0:q>=1?-8:-18, heat: q>=3?10:q>=1?22:38, ctrl: q>=3?0:q>=1?-5:-15, window: q>=3?-6:q>=1?-12:-20 }),
    },

    // ── ACT 2: APPROACH ────────────────────────────────────

    approach_movement_clean: {
      cat: 'movement', act: 'Act II — Approach',
      isComplication: false,
      title: 'East Wing Corridor — Against the Grain',
      body: "The restoration wing is past a secondary checkpoint. A long corridor, two cameras on alternating rotations, and a guard desk at the far end. The guard is doing his job.",
      comms: () => [
        { who: 'ROOK', line: "Left camera covers the first sixty feet. Gap in rotation is fourteen seconds. Center-left until the pillar, then straight through." },
        { who: 'VALE', line: "Guard at the desk notices pace changes. Walk like you have somewhere to be — not like you're trying to get somewhere." },
      ],
      planLine: (p) => p.entry === 'Service Route' ? "Plan says: you know this corridor. Rook mapped it. Trust the route." : 'Plan says: movement is permission. Keep walking.',
      planBonus: (cmd) => ['Slip Past','Hold Nerve',"Rook's Route",'Press Forward','Trust the Plan'].includes(cmd) ? 1 : ['Stall','False Panic','Bluff'].includes(cmd) ? -1 : 0,
      table: [{ r:'9', s:'♠', cmd:'Camera Gap' }, { r:'5', s:'♣', cmd:'Guard Watching' }],
      narrative: (q, cmd) => {
        if(q >= 4) return "You time the camera gap and walk the corridor in one clean pass. The guard glances up and looks back down. You are already past.";
        if(q >= 2) return `You ${cmd.toLowerCase()} through the corridor. The guard notes you without acting on it. Vale marks it as a flag, not a threat.`;
        return `The ${cmd.toLowerCase()} creates a stumble in pace. The guard stands. Vale talks you through it on comms. It resolves, but the corridor is now watched.`;
      },
      deltas: (q) => ({ plan: q>=3?0:q>=1?-8:-18, heat: q>=3?0:q>=1?10:22, ctrl: q>=3?0:q>=1?-5:-15, window: q>=3?-5:q>=1?-9:-16 }),
    },

    approach_movement_comp: {
      cat: 'movement', act: 'Act II — Approach',
      isComplication: true,
      title: 'East Wing Corridor — The Wrong Celebrity',
      body: "The corridor is not empty. A minor celebrity — a television presenter, someone whose face everyone recognizes — has wandered off the gala floor with a small orbit of admirers and a photographer. They have stopped directly in front of the restoration wing checkpoint. The guard at the desk is charmed. Everyone is charmed. The corridor is effectively closed.",
      comms: () => [
        { who: 'NIX',  line: "He responds to attention. Give him more of it — pull the orbit your direction and the corridor opens behind you." },
        { who: 'VALE', line: "Or go through them. Slowly. A staff member moving through a cluster of donors. Invisible by category." },
      ],
      planLine: (p) => p.entry === 'Service Route' ? 'Plan says: east wing corridor, center-left past the pillar, straight through.' : 'Plan says: movement is permission. Keep walking.',
      planBonus: (cmd) => ['Charm','Slip Past','Take the Heat','Sell the Pause'].includes(cmd) ? 1 : ['Press Forward','Improvise','Hold Nerve'].includes(cmd) ? -1 : 0,
      table: [{ r:'Q', s:'♥', cmd:'Celebrity Orbit' }, { r:'7', s:'♣', cmd:'Guard Distracted' }],
      narrative: (q, cmd) => {
        if(q >= 4) return `You ${cmd.toLowerCase()} — the celebrity notices you, briefly, with the particular pleasure of someone who enjoys being noticed noticing someone else. The orbit shifts. The corridor opens. You move through it before the photographer turns back.`;
        if(q >= 2) return `You ${cmd.toLowerCase()} through the cluster at the pace of staff. One of the admirers asks if you work here. You say yes without stopping. They accept it.`;
        return `The ${cmd.toLowerCase()} creates the wrong dynamic. The celebrity's people close around you. You spend two minutes extracting yourself. The window through the corridor narrows.`;
      },
      deltas: (q) => ({ plan: q>=3?0:q>=1?-10:-20, heat: q>=3?5:q>=1?15:28, ctrl: q>=3?5:q>=1?-5:-18, window: q>=3?-8:q>=1?-14:-22 }),
    },

    approach_timing_clean: {
      cat: 'timing', act: 'Act II — Approach',
      isComplication: false,
      title: 'Service Junction — The Rotation Window',
      body: "The junction between the service corridor and the display wing has a camera covering both directions. The window is nine seconds every four minutes. Rook has it mapped to the second.",
      comms: () => [
        { who: 'VALE', line: 'Four minutes out. Nine seconds. Do not move early.' },
        { who: 'ROOK', line: "I can hold the feed three additional seconds if you need it. Say the word before the window opens — not during." },
      ],
      planLine: (p) => "Plan says: wait for Vale's signal. The window is earned, not taken.",
      planBonus: (cmd) => ['Call Timing','Trust the Plan','Signal','Stall'].includes(cmd) ? 1 : ['Improvise','Press Forward','Take the Heat'].includes(cmd) ? -1 : 0,
      table: [{ r:'A', s:'♣', cmd:'Nine Seconds' }, { r:'3', s:'♠', cmd:'Camera Live' }],
      narrative: (q, cmd) => {
        if(q >= 4) return "Vale calls it. You move on the signal — nine seconds, clean, through the junction before the camera returns. Rook doesn't even need to hold the feed.";
        if(q >= 2) return `You ${cmd.toLowerCase()} and hit the window with two seconds to spare. Rook calls it close on comms.`;
        return `You ${cmd.toLowerCase()} early — one second ahead of Vale's signal. The camera catches the edge of your movement. Rook loops the feed. He manages it. Barely.`;
      },
      deltas: (q) => ({ plan: q>=3?5:q>=1?0:-10, heat: q>=3?0:q>=1?8:20, ctrl: q>=3?5:q>=1?0:-10, window: q>=3?-5:q>=1?-9:-16 }),
    },

    approach_timing_comp: {
      cat: 'timing', act: 'Act II — Approach',
      isComplication: true,
      title: 'Service Junction — Rook Is Late',
      body: "The junction is where it should be. The window is not. Vale is counting but the camera rotation has changed — someone on the security staff adjusted the schedule, and Rook's map is running twenty seconds behind. The window will come, but not when expected.",
      comms: () => [
        { who: 'VALE', line: "Rotation is off. I'm recalculating. Hold your position. Do not move until I call it." },
        { who: 'ROOK', line: "I see it. Working the new count now. Thirty seconds." },
      ],
      planLine: (p) => "Plan says: wait for Vale's signal. The window is earned, not taken.",
      planBonus: (cmd) => ['Call Timing','Trust the Plan','Stall','Hold Nerve'].includes(cmd) ? 1 : ['Improvise','Press Forward','Signal'].includes(cmd) ? -1 : 0,
      table: [{ r:'K', s:'♣', cmd:'Count Is Off' }, { r:'4', s:'♠', cmd:'Holding Position' }],
      narrative: (q, cmd) => {
        if(q >= 4) return `You ${cmd.toLowerCase()} — hold, wait, trust the new count. Vale calls it. The window comes thirty seconds late but clean. Rook confirms on the other side.`;
        if(q >= 2) return `You ${cmd.toLowerCase()}. The wait feels long. You move on Vale's call and clear the junction with a second to spare. The delay cost time, not exposure.`;
        return `You ${cmd.toLowerCase()} and move before Vale finishes recalculating. The camera catches your movement. Rook scrambles. The footage is looped but the timing buffer is gone.`;
      },
      deltas: (q) => ({ plan: q>=3?0:q>=1?-8:-18, heat: q>=3?5:q>=1?15:28, ctrl: q>=3?0:q>=1?-8:-18, window: q>=3?-10:q>=1?-16:-26 }),
    },

    // ── ACT 3: VAULT ───────────────────────────────────────

    vault_timing_clean: {
      cat: 'timing', act: 'Act III — The Vault',
      isComplication: false,
      isVault: true,
      title: "Restoration Wing — The Guard's Pattern",
      body: "The restoration wing runs two guards on a staggered rotation. The window between them is four minutes — long enough, but only if Vale has the timing right. The display case is twenty feet away.",
      comms: () => [
        { who: 'VALE', line: 'First guard clears in ninety seconds. Second guard enters at four-ten. Two forty of clean floor. Approach only — do not touch the case until I say.' },
        { who: 'ROOK', line: 'Pressure sensor deactivates on the override code. Code is live from the moment you call it. Call it when you are ready, not before.' },
      ],
      planLine: (p) => 'Plan says: this is timing, not speed. Let Vale count it down.',
      planBonus: (cmd) => ['Call Timing','Trust the Plan','Stall','Hold Nerve'].includes(cmd) ? 1 : ['Press Forward','Improvise','Take the Heat'].includes(cmd) ? -1 : 0,
      table: [{ r:'K', s:'♠', cmd:'Guard Position' }, { r:'4', s:'♥', cmd:'Window Opening' }],
      narrative: (q, cmd) => {
        if(q >= 4) return "Vale's count is exact. You move on signal, reach the case in thirty seconds, call the override with time to position. The window opens the way it was supposed to.";
        if(q >= 2) return `You ${cmd.toLowerCase()} — timing slightly off but inside tolerance. You are at the case with ninety seconds remaining.`;
        return `The ${cmd.toLowerCase()} costs forty seconds. You reach the case with fifty seconds left. Not enough for the planned approach. You adapt. The adaptation is visible on one camera.`;
      },
      deltas: (q) => ({ plan: q>=3?5:q>=1?0:-10, heat: q>=3?0:q>=1?8:18, ctrl: q>=3?5:q>=1?0:-10, window: q>=3?-8:q>=1?-12:-20 }),
    },

    vault_timing_comp: {
      cat: 'timing', act: 'Act III — The Vault',
      isComplication: true,
      isVault: true,
      title: "Restoration Wing — The Rotation Changed",
      body: "The restoration wing rotation has been shortened. Four-minute windows are now two-minute windows. Someone adjusted the schedule tonight, and Rook's count is wrong. The display case is twenty feet away and the guard will be back in ninety seconds.",
      comms: () => [
        { who: 'VALE', line: "Rotation is half what Rook mapped. I don't know why. You have ninety seconds to reach the case and call the override. Not four minutes. Ninety seconds." },
        { who: 'ROOK', line: "I see it. The new count is correct. Move now if you're moving." },
      ],
      planLine: (p) => "Plan says: four-minute window, approach on Vale's count. Do not touch the case early.",
      planBonus: (cmd) => ['Press Forward','Call Timing','Trust the Plan'].includes(cmd) ? 1 : ['Stall','Hold Nerve','Improvise'].includes(cmd) ? -1 : 0,
      table: [{ r:'2', s:'♥', cmd:'Ninety Seconds' }, { r:'K', s:'♠', cmd:'Guard Returning' }],
      narrative: (q, cmd) => {
        if(q >= 4) return `You ${cmd.toLowerCase()} — immediately, decisively. The ninety seconds are tight but you reach the case with fifteen to spare. The override code is called. Rook confirms the sensor.`;
        if(q >= 2) return `You ${cmd.toLowerCase()} and make it with five seconds. Not the margin the plan assumed. Vale doesn't say anything but her breathing changes on comms.`;
        return `The ${cmd.toLowerCase()} costs you the window. The guard returns before the override is called. You abort the approach and reset. The vault scene has to run again on the next rotation.`;
      },
      deltas: (q) => ({ plan: q>=3?0:q>=1?-12:-25, heat: q>=3?5:q>=1?20:35, ctrl: q>=3?0:q>=1?-10:-22, window: q>=3?-12:q>=1?-20:-32 }),
    },

    vault_transfer_clean: {
      cat: 'transfer', act: 'Act III — The Vault',
      isComplication: false,
      isVault: true,
      title: 'Display Case — The Moment of Contact',
      body: "The sapphire is here. Cushion cut, 24 carats, in a sealed transport case on a lit pedestal. Rook's override code is live. The sensor is deactivated. Sixty seconds.",
      comms: () => [
        { who: 'ROOK', line: 'Override active. Sixty seconds before auto-reset. Case opens on the left hinge.' },
        { who: 'VALE', line: 'Guard rotation in three minutes. The stone needs to be moving before then.' },
      ],
      planLine: (p) => p.grab === 'Clean Swap' ? 'Plan says: replica goes in first, then the stone comes out. No gap.' : p.grab === 'Hidden Transfer' ? 'Plan says: the stone does not stay on you. Move it immediately.' : 'Plan says: fast and clean. Do not hesitate.',
      planBonus: (cmd) => ['Pass the Case','Switch','Signal'].includes(cmd) ? 1 : ['Commit','Press Forward','Bluff'].includes(cmd) ? -1 : 0,
      table: [{ r:'A', s:'♦', cmd:'Case Open' }, { r:'7', s:'♣', cmd:'Sixty Seconds' }],
      narrative: (q, cmd, p) => {
        const grab = p.grab === 'Clean Swap' ? 'The replica goes in. The real stone comes out.' : p.grab === 'Hidden Transfer' ? 'The stone is off your body in under fifteen seconds.' : 'The stone is out. Fast, as planned.';
        if(q >= 4) return `${grab} You ${cmd.toLowerCase()} and the moment closes cleanly. Rook confirms the sensor reset. Vale starts the exit count.`;
        if(q >= 2) return `You ${cmd.toLowerCase()}. ${grab} A small error in the sequence — corrected, but Vale marks it.`;
        return `The ${cmd.toLowerCase()} creates friction at the worst moment. The case sensor chirps once before Rook mutes it. The stone is in hand but the operation just became harder.`;
      },
      targetChange: (q) => q >= 1 ? 'secured' : null,
      deltas: (q) => ({ plan: q>=3?0:q>=1?-10:-20, heat: q>=3?5:q>=1?15:30, ctrl: q>=3?5:q>=1?0:-10, window: q>=3?-8:q>=1?-14:-22 }),
    },

    vault_transfer_comp: {
      cat: 'transfer', act: 'Act III — The Vault',
      isComplication: true,
      isVault: true,
      title: 'Display Case — The Codes Have Cycled',
      body: "The codes reset early. Rook's override is dead. The case is sealed and the sensor is live. The stone is visible through the glass. The guard rotation has three minutes left. Someone changed the reset schedule tonight — or someone wanted you to arrive after the reset.",
      comms: () => [
        { who: 'ROOK', line: "I'm running a bypass. It's slower than the override — ninety seconds minimum. Hold position." },
        { who: 'VALE', line: 'Guard rotation in three minutes. You have time. Not comfortable time.' },
      ],
      planLine: (p) => p.grab === 'Clean Swap' ? 'Plan says: override active, replica in, stone out. Rook holds the sensor.' : p.grab === 'Hidden Transfer' ? 'Plan says: override active, stone transfers immediately. Do not carry it out yourself.' : 'Plan says: override active, sixty seconds. Fast and clean.',
      planBonus: (cmd) => ['Hold Nerve','Trust the Plan','Call Timing','Signal'].includes(cmd) ? 1 : ['Press Forward','Improvise','Bluff'].includes(cmd) ? -1 : 0,
      table: [{ r:'3', s:'♦', cmd:'Bypass Running' }, { r:'K', s:'♥', cmd:'Codes Dead' }],
      narrative: (q, cmd, p) => {
        const grab = p.grab === 'Clean Swap' ? 'The replica goes in. The stone comes out.' : p.grab === 'Hidden Transfer' ? 'The stone moves off your body immediately.' : 'The stone is secured.';
        if(q >= 4) return `You ${cmd.toLowerCase()} — hold position, trust the bypass. Rook calls it at eighty seconds. The case opens. ${grab}`;
        if(q >= 2) return `You ${cmd.toLowerCase()}. The bypass runs long. Two minutes and twelve seconds. The guard rotation has started when the case opens. ${grab} You move before the guard reaches the wing.`;
        return `The ${cmd.toLowerCase()} pushes you to act before the bypass completes. The sensor is still live. The case opens but the alarm registers for four seconds before Rook mutes it. Heat is up.`;
      },
      targetChange: (q) => 'secured',
      deltas: (q) => ({ plan: q>=3?-5:q>=1?-15:-28, heat: q>=3?10:q>=1?25:42, ctrl: q>=3?0:q>=1?-12:-25, window: q>=3?-14:q>=1?-22:-35 }),
    },

    // ── ACT 4: CRISIS ──────────────────────────────────────

    crisis_heat_clean: {
      cat: 'heat', act: 'Act IV — Crisis',
      isComplication: false,
      title: "Service Corridor — Someone's Watching",
      body: "Two guards appear at the far end of the service corridor — ahead of rotation. They're not running, they haven't been radioed. But they're moving with the particular purpose of people who have been told to look for something.",
      comms: (p) => [
        { who: 'VALE', line: p.grab === 'Hidden Transfer'
          ? "They're not after you — you're clean. But Nix is moving through the east corridor right now. If they shift that direction, the stone is in play."
          : "They're not responding to an alarm. Someone reported something. Don't know what. Do not give them a reason to confirm it." },
        { who: 'NIX',  line: p.grab === 'Hidden Transfer'
          ? "I have it. I'm still moving. Give me thirty seconds and do not draw their attention east."
          : "I can create a distraction at the east staircase in thirty seconds. Give me the word — but it costs me my position for the rest of the run." },
      ],
      planLine: (p) => p.grab === 'Fast Snatch' ? 'Plan says: service corridor to loading bay. Move at pace, no stops.' : p.grab === 'Hidden Transfer' ? 'Plan says: you exit clean. Nix carries the stone out separately.' : 'Plan says: service corridor, straight to the loading bay.',
      planBonus: (cmd) => ['Hold Nerve','Stall','False Panic','Fold Cover','Signal'].includes(cmd) ? 1 : ['Press Forward','Burn Disguise','Improvise'].includes(cmd) ? -1 : 0,
      table: [{ r:'10', s:'♠', cmd:'Guards Approaching' }, { r:'6', s:'♣', cmd:'Stone Moving' }],
      narrative: (q, cmd, p) => {
        if(p.grab === 'Hidden Transfer') {
          if(q >= 4) return `You ${cmd.toLowerCase()} — drawing their attention to you, away from the east corridor. The guards pass through without altering direction. Nix confirms on comms, one word: "Clear."`;
          if(q >= 2) return `You ${cmd.toLowerCase()}. One guard slows near the east corridor entrance. Nix holds position. The guard moves on. The stone keeps moving.`;
          return `The ${cmd.toLowerCase()} isn't enough. One guard cuts toward the east corridor. Nix improvises a new route. He makes it, but the stone takes three extra minutes to move and the window shrinks.`;
        }
        if(q >= 4) return `You ${cmd.toLowerCase()}. The guards pass through the corridor without stopping. One of them looks at you — through you, not at you. Vale exhales on comms.`;
        if(q >= 2) return `You ${cmd.toLowerCase()}. One guard pauses. His colleague keeps walking. He follows. The corridor clears. Heat is up but the stone is moving.`;
        return `The ${cmd.toLowerCase()} draws exactly the wrong attention. Questions are asked. Nix fires the distraction. It works but the corridor is now watched.`;
      },
      deltas: (q) => ({ plan: q>=3?0:q>=1?-8:-20, heat: q>=3?5:q>=1?18:35, ctrl: q>=3?0:q>=1?-10:-22, window: q>=3?-6:q>=1?-12:-20 }),
    },

    crisis_heat_comp: {
      cat: 'heat', act: 'Act IV — Crisis',
      isComplication: true,
      title: 'Service Corridor — The Supervisor Again',
      body: "The security supervisor from the entry is in the service corridor. He shouldn't be here. He doesn't have a reason to be here that you can identify. He is standing at the junction where you need to turn, looking at his phone, and he has the particular stillness of someone who is waiting rather than passing through.",
      comms: (p) => [
        { who: 'VALE', line: "He's not on his radio. He's not looking for you specifically. But he's between you and the exit and he remembers faces." },
        { who: 'NIX',  line: p.grab === 'Hidden Transfer'
          ? "I'm rerouting. If he stops you, the stone is already past him. You just need to keep him focused on you."
          : "If he made you at entry, this isn't coincidence. If he didn't, it might still be. You need to know which before you move." },
      ],
      planLine: (p) => p.grab === 'Fast Snatch' ? 'Plan says: service corridor to loading bay. Move at pace, no stops.' : 'Plan says: service corridor, straight to the loading bay.',
      planBonus: (cmd) => ['Hold Nerve','Charm','Sell the Pause','Fold Cover'].includes(cmd) ? 1 : ['Press Forward','Improvise','False Panic','Burn Disguise'].includes(cmd) ? -1 : 0,
      table: [{ r:'K', s:'♥', cmd:'Supervisor Waiting' }, { r:'3', s:'♣', cmd:'Junction Blocked' }],
      narrative: (q, cmd, p) => {
        const stoneNote = p.grab === 'Fast Snatch' ? ' The stone is on you the entire time.' : p.grab === 'Hidden Transfer' ? ' Behind him, Nix is already through.' : '';
        if(q >= 4) return `You ${cmd.toLowerCase()} — through the junction with the unhurried presence of someone who belongs exactly where they are. The supervisor glances up from his phone and looks back down. You are past him before he finishes the thought.${stoneNote}`;
        if(q >= 2) return `You ${cmd.toLowerCase()}. The supervisor looks up. Holds his attention on you for two full seconds. Then his phone buzzes and his focus breaks. You keep moving.${stoneNote}`;
        return `The ${cmd.toLowerCase()} confirms what he suspected. He steps forward. You have to give him something — a name, a reason, something Vale feeds through the earpiece — and it costs you forty seconds and his full attention.${stoneNote}`;
      },
      deltas: (q) => ({ plan: q>=3?0:q>=1?-12:-25, heat: q>=3?10:q>=1?25:42, ctrl: q>=3?0:q>=1?-12:-25, window: q>=3?-8:q>=1?-16:-26 }),
    },

    // ── REVERSAL ───────────────────────────────────────────

    reversal: {
      cat: 'reversal', act: 'Act IV — Crisis',
      isComplication: true,
      isReversal: true,
      title: 'Service Exit — Caught',
      body: "The exit is blocked. The security supervisor and a backup guard. They have a description that matches you. Your access badge is removed before you can speak. The stone is on you. There is no corridor behind you.",
      comms: () => [
        { who: 'VALE', line: "...I'm here." },
        { who: 'NIX',  line: "Don't say anything. Not yet." },
      ],
      planLine: (p) => p.contingency === 'Inside Blue' ? 'Plan says: trust the contingency. This is exactly what it was planted for.' : 'Plan says: hold nerve. Do not give them more than they already have.',
      planBonus: (cmd) => ['Hold Nerve','Signal','Trust the Plan'].includes(cmd) ? 1 : ['Improvise','Press Forward','False Panic','Burn Disguise'].includes(cmd) ? -1 : 0,
      table: [{ r:'K', s:'♠', cmd:'Surrounded' }, { r:'2', s:'♣', cmd:'Cover Gone' }],
      narrative: (q, cmd, p) => {
        // Narrative for contingency fire is handled by the contingency reveal panel.
        // This covers the non-contingency outcomes.
        if(q >= 1) return `You ${cmd.toLowerCase()}. The supervisor is not satisfied but he is uncertain. He holds you in a side room for eleven minutes. The stone is still on you when they release you — they searched the wrong pocket.`;
        if(q >= 0) return `You ${cmd.toLowerCase()} — the pressure shows. They search thoroughly. The stone is in a pocket they almost miss. Almost.`;
        return `You ${cmd.toLowerCase()} — the wrong choice under this pressure. The stone is found. The operation is formally over. Vale doesn't say anything on comms for a long time.`;
      },
      deltas: (q, p, cmd) => {
        // Contingency fires: content package handles target state change via checkContingencyReveal.
        // Engine reads contingencyFired from the reveal result and applies this delta.
        if(q >= 1) return { plan: -15, heat: 20, ctrl: -15, window: -10 };
        if(q >= 0) return { plan: -25, heat: 35, ctrl: -25, window: -15, target: 'lost' };
        return { plan: -35, heat: 50, ctrl: -40, window: -20, target: 'lost' };
      },
      // Separate delta for when contingency fires successfully
      contingencyDeltas: { plan: 15, heat: -15, ctrl: 20, window: -5, target: 'transferred' },
    },

    // ── ACT 5: EXIT ────────────────────────────────────────

    exit_clean: {
      cat: 'movement', act: 'Act V — Exit',
      isComplication: false,
      title: 'Loading Bay — The Last Corridor',
      body: "The loading bay is sixty feet ahead. Rook has the door on a thirty-second timer. Whatever happened behind you is already becoming a story that will be told differently each time. The door is what matters.",
      comms: () => [
        { who: 'VALE', line: "Car is outside. Thirty seconds. Walk out the way you walked in — like you're done here and there was never anything unusual about it." },
        { who: 'NIX',  line: "I'm already outside. You're the last one. Move." },
      ],
      planLine: (p) => p.grab === 'Fast Snatch' ? 'Plan says: walk, do not run. The stone has been on you the whole way. Last sixty feet.' : p.grab === 'Hidden Transfer' ? 'Plan says: walk out clean. Nix is handling the rest.' : 'Plan says: walk, do not run. You are done here. Act like it.',
      planBonus: (cmd) => ['Slip Past','Hold Nerve','Trust the Plan','Press Forward'].includes(cmd) ? 1 : ['Stall','False Panic'].includes(cmd) ? -1 : 0,
      table: [{ r:'8', s:'♦', cmd:'Bay Ahead' }, { r:'5', s:'♠', cmd:'Thirty Seconds' }],
      narrative: (q, cmd, p) => {
        const grabNote = p.grab === 'Fast Snatch'
          ? ' The stone has been on you since the vault. You walk out with it the way you walked in with nothing — at exactly the same pace.'
          : p.grab === 'Hidden Transfer'
          ? ' The stone left your body in the vault. You walk out clean. Somewhere ahead, Nix carries what you came for.'
          : p.grab === 'Clean Swap'
          ? ' The replica is still sitting in the case. Nobody knows yet.'
          : '';
        if(q >= 4) return `Rook opens the door. You walk through it at exactly the right pace. The car is where it was supposed to be. Vale says one word on comms: "Clean."${grabNote}`;
        if(q >= 2) return `You ${cmd.toLowerCase()} through the corridor. The door opens four seconds late. You adapt. The car is there.${grabNote}`;
        return `The ${cmd.toLowerCase()} costs time. There is a moment — just a moment — when it could have gone the other way. Then it doesn't, and the door is behind you.`;
      },
      deltas: (q) => ({ plan: 0, heat: q>=3?-5:q>=1?5:15, ctrl: q>=3?10:q>=1?0:-10, window: q>=3?-4:q>=1?-8:-14 }),
    },

    exit_high_heat: {
      cat: 'social', act: 'Act V — Exit',
      isComplication: false,
      title: 'East Lobby — Back Through the Front',
      body: "Heat is high enough that the service routes are watched. You go back the way some people came in — through the east lobby, through the donors, through the noise. One more performance.",
      comms: () => [
        { who: 'NIX',  line: "I'm on the floor. I can walk with you. Two people leaving a party together are invisible." },
        { who: 'VALE', line: "Front desk won't stop you leaving. Keep moving forward. Do not look at the supervisor." },
      ],
      planLine: (p) => p.grab === 'Fast Snatch' ? 'Plan says: one last social moment with the stone still on you. Make it count.' : 'Plan says: you are a donor who has had enough champagne. Exit with the crowd.',
      planBonus: (cmd) => ['Commit','Hold Nerve','Charm','Sell the Pause'].includes(cmd) ? 1 : ['Slip Past','Improvise'].includes(cmd) ? -1 : 0,
      table: [{ r:'J', s:'♥', cmd:'Lobby Eyes' }, { r:'9', s:'♦', cmd:'Exit Ahead' }],
      narrative: (q, cmd, p) => {
        // Discovery spike: if Clean Swap and window collapsed, someone noticed
        const discoveryFired = p.grab === 'Clean Swap' && (p._windowAtExit || 50) < 25;
        const discoveryLine = discoveryFired ? ' Behind you, somewhere in the restoration wing, someone has noticed the case.' : '';
        if(q >= 4) return `You ${cmd.toLowerCase()} through the lobby — one donor among dozens saying their goodnights. Nobody stops you. Nobody looks. The door opens onto the street.${discoveryLine}`;
        if(q >= 2) return `You ${cmd.toLowerCase()} and keep moving. Someone near the door makes eye contact a beat too long. You don't stop. Neither does he, eventually.${discoveryLine}`;
        return `The ${cmd.toLowerCase()} draws one moment of real attention. Nix appears beside you, says something charming to the nearest guest, and the moment passes. The exit is thirty feet away.${discoveryLine}`;
      },
      deltas: (q) => ({ plan: 0, heat: q>=3?-8:q>=1?5:20, ctrl: q>=3?5:q>=1?0:-8, window: q>=3?-4:q>=1?-8:-14 }),
    },
  },

};
