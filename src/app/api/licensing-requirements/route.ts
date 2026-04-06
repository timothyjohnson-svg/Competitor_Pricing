import { db } from '@/lib/db';
import { licensingRequirements } from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { NextResponse, type NextRequest } from 'next/server';

// Two-letter state code: letters only, max 2 chars
const STATE_RE = /^[A-Z]{2}$/;
// Line of authority slug: lowercase letters and hyphens only, max 40 chars
const LINE_RE = /^[a-z-]{1,40}$/;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const rawState = searchParams.get('state');
  const rawLine = searchParams.get('line');

  // If no params, return distinct states with comingSoon status
  if (!rawState) {
    const rows = await db
      .select({
        state: licensingRequirements.state,
        stateName: licensingRequirements.stateName,
        comingSoon: sql<boolean>`bool_or(${licensingRequirements.comingSoon})`.as('coming_soon'),
      })
      .from(licensingRequirements)
      .groupBy(licensingRequirements.state, licensingRequirements.stateName)
      .orderBy(licensingRequirements.stateName)
      .limit(60); // max ~50 US states + territories

    return NextResponse.json({ states: rows });
  }

  // Validate state param
  const state = rawState.toUpperCase();
  if (!STATE_RE.test(state)) {
    return NextResponse.json({ error: 'Invalid state code.' }, { status: 400 });
  }

  // If state but no line, return available lines for that state
  if (!rawLine) {
    const rows = await db
      .select({
        lineOfAuthority: licensingRequirements.lineOfAuthority,
        lineOfAuthorityLabel: licensingRequirements.lineOfAuthorityLabel,
        comingSoon: licensingRequirements.comingSoon,
      })
      .from(licensingRequirements)
      .where(eq(licensingRequirements.state, state))
      .orderBy(licensingRequirements.lineOfAuthorityLabel)
      .limit(20); // max lines of authority per state

    return NextResponse.json({ lines: rows });
  }

  // Validate line param
  if (!LINE_RE.test(rawLine)) {
    return NextResponse.json({ error: 'Invalid line of authority.' }, { status: 400 });
  }

  // Return the full requirement
  const rows = await db
    .select()
    .from(licensingRequirements)
    .where(
      and(
        eq(licensingRequirements.state, state),
        eq(licensingRequirements.lineOfAuthority, rawLine),
      ),
    )
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: 'No licensing requirements found for this state and line of authority.' },
      { status: 404 },
    );
  }

  return NextResponse.json({ requirement: rows[0] });
}
