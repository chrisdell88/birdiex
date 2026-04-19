import type { MatchupOddsEntry } from '../types';

// RBC Heritage 2026 - R2 H2H matchups (2-way / ties=void only)
// Source: DataGolf matchup odds export
// Format: tab-separated, 12 books (betcris, pinnacle, draftkings, bet365, fanduel,
//         betmgm, pointsbet, bovada, betonline, caesars, unibet, datagolf)

const BOOK_KEYS = [
  'betcris', 'pinnacle', 'draftkings', 'bet365', 'fanduel',
  'betmgm', 'pointsbet', 'bovada', 'betonline', 'caesars',
  'unibet', 'datagolf',
] as const;

// Raw TSV rows (ties=void only, 3-way rows excluded)
// Columns: p1, p2, then for each book: p1, p2 (ties column dropped since all void)
const RAW_ROWS = `Kitayama, Kurt|Clark, Wyndham|null|null|null|null|null|null|null|null|null|null|-110|-110|null|null|null|null|null|null|null|null|null|null|null|null|-108|108
Kim, Si Woo|Cantlay, Patrick|null|null|null|null|null|null|null|null|null|null|-115|-105|null|null|null|null|null|null|null|null|null|null|null|null|-107|107
Henley, Russell|Fitzpatrick, Matt|null|null|null|null|null|null|null|null|null|null|-105|-115|null|null|null|null|null|null|null|null|null|null|null|null|104|-104
Scheffler, Scottie|Schauffele, Xander|null|null|null|null|null|null|-182|140|-160|135|null|null|null|null|null|null|null|null|null|null|null|null|-133|133
Smith, Jordan|Wallace, Matt|-124|-106|null|null|null|null|null|null|-105|-115|null|null|null|null|null|null|null|null|null|null|null|null|101|-101
Woodland, Gary|Brennan, Michael|null|null|null|null|null|null|null|null|null|null|-110|-110|null|null|null|null|null|null|null|null|null|null|null|null|107|-107
English, Harris|Griffin, Ben|null|null|null|null|null|null|null|null|null|null|-115|-105|null|null|null|null|null|null|-110|-110|null|null|null|null|-109|109
Spaun, J.J.|MacIntyre, Robert|null|null|null|null|null|null|null|null|null|null|105|-125|null|null|null|null|null|null|null|null|null|null|null|null|130|-130
Spieth, Jordan|Straka, Sepp|null|null|null|null|null|null|null|null|null|null|-115|-105|null|null|null|null|null|null|null|null|null|null|null|null|101|-101
Young, Cameron|Gotterup, Chris|null|null|null|null|null|null|null|null|null|null|-165|140|null|null|null|null|null|null|null|null|null|null|null|null|-171|171
Hovland, Viktor|Aberg, Ludvig|null|null|null|null|102|-134|null|null|100|-120|null|null|null|null|null|null|null|null|null|null|null|null|116|-116
Vegas, Jhonattan|Coody, Pierceson|null|null|null|null|132|-166|125|-162|130|-161|null|null|null|null|140|-170|150|-190|140|-180|null|null|155|-155
Fox, Ryan|Kim, Michael|null|null|-107|-111|-110|-114|100|-125|-111|-111|null|null|-110|-110|null|null|-115|-115|-129|102|null|null|105|-105
Putnam, Andrew|Mouw, William|null|null|-143|120|-146|116|-137|110|-143|115|null|null|-130|110|null|null|-130|100|-162|128|null|null|-121|121
Berger, Daniel|Higgo, Garrick|null|null|null|null|-188|150|-200|162|null|null|null|null|-210|180|null|null|-220|170|-240|180|null|null|-187|187
Valimaki, Sami|Stevens, Sam|null|null|124|-148|125|-156|110|-137|115|-143|null|null|115|-135|null|null|110|-140|120|-152|null|null|124|-124
Fowler, Rickie|Kitayama, Kurt|null|null|-118|-101|-126|100|-111|-111|-125|100|null|null|-125|105|null|null|-135|105|-129|102|null|null|-102|102
Noren, Alex|Hojgaard, Nicolai|null|null|null|null|-125|100|-125|100|null|null|null|null|-115|-105|null|null|-135|105|-132|104|null|null|-125|125
Clark, Wyndham|Potgieter, Aldrich|null|null|-207|168|-180|144|-187|150|-167|135|null|null|-170|140|null|null|-190|150|-200|160|null|null|-179|179
Cauley, Bud|Smotherman, Austin|null|null|null|null|-124|-102|-137|110|-125|100|null|null|-125|105|null|null|-160|125|-139|110|null|null|-124|124
Hall, Harry|Castillo, Ricky|null|null|null|null|-136|108|-137|110|-130|105|null|null|-145|120|null|null|-140|110|-143|112|null|null|-129|129
Bradley, Keegan|Kim, Si Woo|null|null|124|-149|126|-158|125|-162|115|-143|null|null|120|-150|null|null|130|-170|126|-162|null|null|154|-154
McNealy, Maverick|Novak, Andrew|null|null|null|null|-162|130|-162|125|null|null|null|null|-145|115|null|null|-150|120|-129|102|null|null|-138|138
Echavarria, Nico|Bhatia, Akshay|null|null|null|null|144|-180|125|-150|135|-167|null|null|120|-150|null|null|130|-170|126|-162|null|null|157|-157
Cantlay, Patrick|Conners, Corey|null|null|-120|101|-160|128|-150|125|-149|120|null|null|-155|125|null|null|-155|122|-152|120|null|null|-129|129
Lowry, Shane|Morikawa, Collin|null|null|123|-147|115|-144|120|-150|105|-130|null|null|115|-145|null|null|122|-155|120|-152|null|null|140|-140
Henley, Russell|Schauffele, Xander|null|null|-109|-109|-108|-118|100|-125|null|null|null|null|-105|-115|-110|-110|-105|-125|-107|-120|null|null|101|-101
Fleetwood, Tommy|Burns, Sam|null|null|null|null|-132|105|-137|110|null|null|null|null|-125|105|-128|107|-140|110|-117|-109|null|null|-121|121
Fitzpatrick, Matt|Scheffler, Scottie|null|null|129|-155|148|-184|137|-187|null|null|null|null|135|-165|137|-165|140|-180|130|-167|null|null|133|-133
Day, Jason|Knapp, Jake|105|-135|-102|-117|-104|-122|-110|-120|-105|-118|null|null|100|-120|null|null|-105|-125|-103|-125|null|null|102|-102
Homa, Max|Yellamaraju, Sudarshan|-154|123|null|null|-114|-110|-137|110|-111|-111|null|null|-120|100|null|null|-135|105|-122|-105|null|null|-123|123
Lipsky, David|Blanchet, Chandler|null|null|null|null|-114|-110|-111|-111|-111|-111|null|null|-115|-105|null|null|-115|-115|-107|-120|null|null|-104|104
Campbell, Brian|Highsmith, Joe|null|null|-138|116|null|null|-125|100|null|null|null|null|-135|115|null|null|-135|105|-143|112|null|null|-121|121
Schenk, Adam|Wallace, Matt|null|null|null|null|null|null|162|-200|175|-222|null|null|180|-210|null|null|160|-200|180|-240|null|null|191|-191
Smith, Jordan|McCarthy, Denny|null|null|null|null|-112|-112|-137|110|-111|-111|null|null|-115|-105|null|null|-140|110|-122|-105|null|null|-115|115
Poston, J.T.|Fisk, Steven|null|null|null|null|-172|138|-187|137|-161|130|null|null|-185|155|null|null|-180|140|-152|120|null|null|-156|156
Glover, Lucas|Rodgers, Patrick|null|null|null|null|-102|-122|-110|-120|100|-125|null|null|-105|-115|null|null|-105|-125|-103|-125|null|null|106|-106
Hisatsune, Ryo|Brennan, Michael|null|null|null|null|-136|108|-125|100|-130|105|null|null|-130|110|null|null|-125|-105|-105|-122|null|null|-113|113
Hoge, Tom|Vilips, Karl|null|null|null|null|null|null|100|-125|-105|-118|null|null|-105|-115|null|null|105|-135|-120|-107|null|null|-106|106
Lee, Min Woo|Pendrith, Taylor|null|null|null|null|-158|126|-187|150|-161|130|null|null|-165|140|null|null|-190|150|-186|150|null|null|-183|183
Thorbjornsen, Michael|McCarty, Matt|-113|-117|null|null|-128|102|100|-125|-111|-111|null|null|-115|-105|null|null|-105|-125|-120|-107|null|null|111|-111
Finau, Tony|Gerard, Ryan|null|null|null|null|122|-154|162|-200|130|-161|null|null|135|-160|null|null|140|-180|120|-152|null|null|178|-178
Taylor, Nick|English, Harris|null|null|107|-128|-102|-124|100|-125|100|-125|null|null|110|-130|null|null|105|-135|120|-152|null|null|116|-116
MacIntyre, Robert|Griffin, Ben|-166|132|-144|120|-130|105|-137|110|-130|105|null|null|-145|120|null|null|-140|110|-139|110|null|null|-132|132
Harman, Brian|Im, Sungjae|null|null|-102|-116|-116|-108|-111|-111|-111|-111|null|null|-110|-110|null|null|-110|-120|-105|-122|null|null|101|-101
Spaun, J.J.|Bridgeman, Jacob|-126|-104|null|null|-106|-118|-111|-111|-105|-118|null|null|-110|-110|null|null|-115|-115|-129|102|null|null|-103|103
Woodland, Gary|Straka, Sepp|null|null|120|-143|126|-158|110|-137|120|-149|null|null|115|-135|null|null|120|-150|120|-152|null|null|130|-130
Hovland, Viktor|Gotterup, Chris|null|null|-135|113|-128|102|-125|100|null|null|null|null|-130|110|null|null|-135|105|-139|110|null|null|-133|133
Thomas, Justin|Aberg, Ludvig|null|null|null|null|118|-148|125|-162|null|null|null|null|120|-150|null|null|135|-175|130|-167|null|null|152|-152
Spieth, Jordan|Young, Cameron|null|null|126|-151|105|-132|110|-137|null|null|null|null|115|-135|null|null|110|-140|110|-139|null|null|151|-151
Horschel, Billy|Theegala, Sahith|null|null|null|null|120|-152|125|-162|110|-137|null|null|120|-145|null|null|130|-170|120|-152|null|null|137|-137
Penge, Marco|Keefer, Johnny|null|null|null|null|-134|106|-125|100|-125|100|null|null|-120|100|null|null|-135|105|-122|-105|null|null|-105|105
Fowler, Rickie|Stevens, Sam|null|null|null|null|null|null|null|null|null|null|null|null|null|null|-114|-106|null|null|null|null|null|null|-105|105
Kitayama, Kurt|Hojgaard, Nicolai|null|null|null|null|null|null|null|null|null|null|null|null|null|null|-115|-105|null|null|null|null|null|null|-112|112
Noren, Alex|Bradley, Keegan|null|null|null|null|null|null|null|null|null|null|null|null|null|null|-118|-102|null|null|null|null|null|null|-122|122
Clark, Wyndham|Bhatia, Akshay|null|null|null|null|null|null|null|null|null|null|null|null|null|null|-102|-118|null|null|null|null|null|null|101|-101
Novak, Andrew|Hall, Harry|-115|-115|null|null|null|null|null|null|null|null|null|null|null|null|-110|-110|null|null|null|null|null|null|119|-119
Kim, Si Woo|McNealy, Maverick|-167|133|null|null|null|null|null|null|null|null|null|null|null|null|-155|129|null|null|null|null|null|null|-127|127
Cantlay, Patrick|Morikawa, Collin|104|-134|null|null|null|null|null|null|null|null|null|null|null|null|109|-130|null|null|null|null|null|null|107|-107
Day, Jason|Lowry, Shane|null|null|null|null|-115|-114|null|null|null|null|null|null|null|null|-110|-110|null|null|null|null|null|null|104|-104
Wallace, Matt|Poston, J.T.|null|null|null|null|null|null|null|null|null|null|null|null|null|null|-107|-113|null|null|null|null|null|null|115|-115
Smith, Jordan|Brennan, Michael|null|null|null|null|null|null|null|null|null|null|null|null|null|null|-102|-118|null|null|null|null|null|null|-104|104
Lee, Min Woo|Hisatsune, Ryo|-143|113|null|null|null|null|null|null|null|null|null|null|null|null|-134|112|null|null|null|null|null|null|-123|123
Pendrith, Taylor|McCarty, Matt|null|null|null|null|null|null|null|null|null|null|null|null|null|null|122|-147|null|null|null|null|null|null|147|-147
Thorbjornsen, Michael|Gerard, Ryan|null|null|null|null|null|null|null|null|null|null|null|null|null|null|-104|-116|null|null|null|null|null|null|120|-120
Finau, Tony|Taylor, Nick|null|null|null|null|null|null|null|null|null|null|null|null|null|null|133|-160|null|null|null|null|null|null|173|-173
Straka, Sepp|MacIntyre, Robert|null|null|null|null|null|null|null|null|null|null|null|null|null|null|113|-135|null|null|null|null|null|null|132|-132
Harman, Brian|Bridgeman, Jacob|null|null|null|null|null|null|null|null|null|null|null|null|null|null|-104|-116|null|null|null|null|null|null|110|-110
Im, Sungjae|Spaun, J.J.|null|null|null|null|null|null|null|null|null|null|null|null|null|null|106|-126|null|null|null|null|null|null|112|-112
Woodland, Gary|Penge, Marco|null|null|null|null|null|null|null|null|null|null|null|null|null|null|-140|117|null|null|null|null|null|null|-126|126
Spieth, Jordan|Hovland, Viktor|null|null|null|null|null|null|null|null|null|null|null|null|null|null|104|-124|null|null|null|null|null|null|116|-116
Thomas, Justin|Gotterup, Chris|null|null|null|null|null|null|null|null|null|null|null|null|null|null|-104|-116|null|null|null|null|null|null|-101|101
Aberg, Ludvig|Young, Cameron|-123|-107|null|null|null|null|null|null|null|null|null|null|null|null|-113|-107|null|null|null|null|null|null|112|-112
Kim, Michael|Coody, Pierceson|-121|-109|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|-103|103
Putnam, Andrew|Kitayama, Kurt|110|-140|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|121|-121
Berger, Daniel|Stevens, Sam|-129|-101|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|101|-101
Fowler, Rickie|Hojgaard, Nicolai|-142|112|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|-112|112
Noren, Alex|Clark, Wyndham|-111|-119|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|-120|120
Cauley, Bud|Castillo, Ricky|-147|117|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|-117|117
Bradley, Keegan|Conners, Corey|105|-135|-112|-116|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|112|-112
Lowry, Shane|Bhatia, Akshay|-133|103|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|-110|110
Henley, Russell|Scheffler, Scottie|141|-178|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|137|-137
Fleetwood, Tommy|Schauffele, Xander|117|-147|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|128|-128
Fitzpatrick, Matt|Burns, Sam|-167|133|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|-158|158
McCarthy, Denny|Poston, J.T.|109|-139|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|132|-132
Finau, Tony|Pendrith, Taylor|116|-146|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|111|-111
Taylor, Nick|Gerard, Ryan|-127|-103|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|105|-105
English, Harris|Im, Sungjae|-128|-102|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|-124|124
Harman, Brian|Gotterup, Chris|-114|-116|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|-104|104
Woodland, Gary|Theegala, Sahith|-109|-121|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|110|-110
Straka, Sepp|Hovland, Viktor|108|-138|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|115|-115
Thomas, Justin|Spieth, Jordan|100|-130|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|113|-113
Henley, Russell|Kim, Si Woo|null|null|null|null|-134|102|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|-108|108
Cantlay, Patrick|Burns, Sam|null|null|null|null|-128|-104|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|-136|136
Fitzpatrick, Matt|Morikawa, Collin|null|null|null|null|-125|-104|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|-109|109
English, Harris|Straka, Sepp|null|null|null|null|-106|-124|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|-109|109
Taylor, Nick|Theegala, Sahith|null|null|null|null|-112|-118|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|-113|113
Spaun, J.J.|Griffin, Ben|null|null|null|null|-114|-114|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|null|100|-100`;

function formatOdd(s: string): string {
  const n = parseInt(s, 10);
  if (isNaN(n)) return s;
  return n > 0 ? `+${n}` : `${n}`;
}

function parseRows(): MatchupOddsEntry[] {
  const entries: MatchupOddsEntry[] = [];
  for (const line of RAW_ROWS.trim().split('\n')) {
    const parts = line.split('|');
    const [p1, p2, ...bookCols] = parts;
    const odds: Record<string, { p1: string; p2: string }> = {};
    BOOK_KEYS.forEach((book, i) => {
      const v1 = bookCols[i * 2];
      const v2 = bookCols[i * 2 + 1];
      if (v1 && v2 && v1 !== 'null' && v2 !== 'null') {
        odds[book] = { p1: formatOdd(v1), p2: formatOdd(v2) };
      }
    });
    entries.push({ p1_player_name: p1, p2_player_name: p2, odds });
  }
  return entries;
}

export const heritageR2MatchupOdds: MatchupOddsEntry[] = parseRows();
