import { db } from '@/lib/db';
import { licensingRequirements } from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const state = searchParams.get('state');
  const line = searchParams.get('line');

  // If no params, return distinct states with comingSoon status
  if (!state) {
    const rows = await db
      .select({
        state: licensingRequirements.state,
        stateName: licensingRequirements.stateName,
        comingSoon: sql<boolean>`bool_or(${licensingRequirements.comingSoon})`.as('coming_soon'),
      })
      .from(licensingRequirements)
      .groupBy(licensingRequirements.state, licensingRequirements.stateName)
      .orderBy(licensingRequirements.stateName);

    return NextResponse.json({ states: rows });
  }

  // If state but no line, return available lines for that state
  if (state && !line) {
    const rows = await db
      .select({
        lineOfAuthority: licensingRequirements.lineOfAuthority,
        lineOfAuthorityLabel: licensingRequirements.lineOfAuthorityLabel,
        comingSoon: licensingRequirements.comingSoon,
      })
      .from(licensingRequirements)
      .where(eq(licensingRequirements.state, state.toUpperCase()))
      .orderBy(licensingRequirements.lineOfAuthorityLabel);

    return NextResponse.json({ lines: rows });
  }

  // If both, return the full requirement
  const rows = await db
    .select()
    .from(licensingRequirements)
    .where(
      and(
        eq(licensingRequirements.state, state.toUpperCase()),
        eq(licensingRequirements.lineOfAuthority, line!),
      ),
    );

  if (rows.length === 0) {
    return NextResponse.json(
      { error: 'No licensing requirements found for this state and line of authority.' },
      { status: 404 },
    );
  }

  return NextResponse.json({ requirement: rows[0] });
}
