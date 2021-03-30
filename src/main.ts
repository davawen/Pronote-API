import * as io from 'console-read-write';

import * as pronote from 'pronote-api';

import * as fs from 'fs';

// type Skill = 'FRANCAIS' | 'ESPAGNOL LV2' | 'ANGLAIS LV1' | 'EDUCATION MUSICALE' | 'HISTOIRE-GEOGRAPHIE' | 'MATHEMATIQUES' | 'SCIENCES VIE & TERRE' | 'PHYSIQUE-CHIMIE' | 'TECHNOLOGIE' | 'ED.PHYSIQUE & SPORT.' | 'ARTS PLASTIQUES' | 'LATIN';
type evaluationShort = 'A+' | 'A' | 'C' | 'E' | 'Abs' | 'Ne';
type evaluationLong = 'Très bonne maîtrise' | 'Maîtrise satisfaisante' | "Maîtrise fragile" | 'Maîtrise insuffisante' | 'Absent';

class Evaluation
{
	name: string;
	coef: number;
	date: Date;
	levels:
	{
		short: evaluationShort,
		long: evaluationLong,
		name: string
	}[]
	
	constructor(name: string, coef: number, date: Date)
	{
		this.name = name;
		this.coef = coef;
		this.date = date;
		
		this.levels = [];
	}
}

class Moyenne
{
	name: string;
	total: number;
	value: number;
	'A+': number;
	'A': number;
	'C': number;
	'E': number;
	'Abs': number;
	'Ne': number;
	
	constructor(name: string)
	{
		this.name = name;
		
		this.total = 0;
		this.value = 0;
		
		this['A+'] = 0;
		this['A'] = 0;
		this['C'] = 0;
		this['E'] = 0;
		this['Abs'] = 0;
		this['Ne'] = 0;
	}
	
	increment(value: evaluationShort, coef: number)
	{
		if(value == 'Abs' || value == 'Ne') this[value]++;
		else
		{
			this[value] += coef;
			this.total += coef;
		}
	}
	
	calculate()
	{
		this.value = (this['A+']*4 + this['A']*3 + this['C']*2 + this['E'])/this.total * 5;
		
		return this.value;
	}
}

function getColor(mark: evaluationShort): string
{
	switch(mark)
	{
		case 'A+':
			return '\u001b[32m';
			break;
		case 'A':
			return '\u001b[36m';
			break;
		case 'C':
			return '\u001b[93m';
			break;
		case 'E':
			return '\u001b[31m';
			break;
		case 'Ne':
		case 'Abs':
			return '\u001b[0m';
			break;
		default:
			return '';
			break;
	}
}

async function main()
{
	const url = "https://0261030d.index-education.net/pronote";
	
	io.write("Username");
	let username = await io.read();
	
	io.write("Password");
	let password = await io.read();
	
	let session = await pronote.login(url, username, password);
	
	let map: Map<string, Evaluation[]> = new Map();
	
	for(let i = 0; i < 3; i++)
	{
		const skills = await session.evaluations(`Trimestre ${i+1}`);
		
		skills.forEach(
			area =>
			{
				let evaluations: Evaluation[];
				
				if(map.has(area.name)) evaluations = map.get(area.name);
				else evaluations = [];
				
				area.evaluations.forEach(
					e =>
					{
						let level = new Evaluation(e.name, e.coefficient, e.date);
						
						e.levels.forEach(
							l =>
							{
								level.levels.push(
									{
										name: l.name,
										short: l.value.short as evaluationShort,
										long: l.value.long as evaluationLong
									}
								);
							}
						);
						
						// _e.levels.forEach(
						// 	l =>
						// 	{
						// 		levels.push({
						// 			short: l.value.short as evaluationShort,
						// 			long: l.value.long as evaluationLong
						// 		});
								
						// 		moyenne[l.value.short]++;
						// 		if(l.value.short != 'Abs' && l.value.short != 'Ne') moyenne['Total']++;
						// 	}
						// );
						
						evaluations.push(level);
					}	
				);
				
				map.set(area.name, evaluations);
			}
		);
	}
	
	console.log(map);
	
	let moyenne: Map<string, Map<string, Moyenne>> = new Map();
	
	map.forEach(
		(area, key) =>
		{
			let m: Map<string, Moyenne> = new Map();
			
			let areaM = new Moyenne(key);
			
			area.forEach(
				e =>
				{
					var _date = `${e.date.getMonth()}/${e.date.getFullYear()}`;
					
					let _m: Moyenne;
					
					if(m.has(_date)) _m = m.get(_date);
					else _m = new Moyenne(key);
					
					e.levels.forEach(
						l =>
						{
							_m.increment(l.short, e.coef);
							areaM.increment(l.short, e.coef);
						}
					);
					
					_m.calculate();
					
					m.set(_date, _m);
				}
			);
			
			areaM.calculate();
			
			m.set('$All', areaM);
			
			moyenne.set(key, m);
		}
	);
	
	console.log(moyenne);
	
	// let moyenne = { 'A+': 0, 'A': 0, 'C': 0, 'E': 0, 'Abs': 0, 'Ne': 0, 'Total': 0 };

	// map.forEach(
	// 	(_m, key) => 
	// 	{
	// 		str += `${key}: \n`;
			
	// 		_m.forEach(
	// 			(evalNote, evalName) =>
	// 			{
	// 				str += `  ${evalName}: \n`;
	// 				evalNote.forEach(n => str += `   - ${getColor(n.short)}${n.long}\u001b[0m\n`)
	// 			}
	// 		)
	// 	}
	// );
	
	fs.writeFileSync("./index.html",
		`<html>

<head>
	<script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
	<script type="text/javascript">
		google.charts.load('current', { 'packages': ['corechart'] });
		google.charts.setOnLoadCallback(drawChart);

		function drawChart()
		{
			var data = google.visualization.arrayToDataTable([
				['Mois', 'Moyenne', 'Français', 'Anglais'],
				['07/2020', 17.5, 14, 19],
				['08/2020', 16, 14, 19],
				['09/2020', 17, 14, 19],
				['10/2020', 16.5, 14, 19]
			]);

			var options = {
				title: 'Moyenne',
				hAxis: { title: 'Mois', titleTextStyle: { color: '#333' } },
				vAxis: { minValue: 0, maxValue: 20 }
			};

			var chart = new google.visualization.AreaChart(document.getElementById('chart_div'));
			chart.draw(data, options);
		}
	</script>
</head>

<body>
	<div id="chart_div" style="width: 100%; height: 500px;"></div>
</body>

</html>`
	);
	
	// let start = (process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open');
	// require('child_process').exec(start + ' ' + __dirname + '');
	
	
	
	// console.log(`Moyenne:\n  ${JSON.stringify(moyenne, null, 2)}\n\nMoyenne Générale: ${(moyenne['A+']*4+moyenne['A']*3+moyenne['C']*2+moyenne['E'])/moyenne['Total'] * 5}`);
	
	io.write(session.user.name);
	// console.log(map);
}

main().catch(
	err => 
	{
		if(err.code === pronote.errors.WRONG_CREDENTIALS.code) console.log("Mauvais identifiants");
		else console.log(err);
	}
);

