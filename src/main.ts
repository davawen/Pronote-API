import * as io from 'console-read-write';

import * as pronote from 'pronote-api';

import * as fs from 'fs';

type evaluationShort = 'A+' | 'A' | 'C' | 'E' | 'Abs';
type evaluationLong = 'Très bonne maîtrise' | 'Maîtrise satisfaisante' | "Maîtrise fragile" | 'Maîtrise insuffisante' | 'Absent';
type evaluation = {short: evaluationShort, long: evaluationLong};

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
	
	let map: Map<string, Map<string, evaluation[]>> = new Map();
	
	for(let i = 0; i < 3; i++)
	{
		const evaluations = await session.evaluations(`Trimestre ${i+1}`);
		
		evaluations.forEach(
			e =>
			{
				let _m: Map<string, evaluation[]>;
				
				if(map.has(e.name)) _m = map.get(e.name);
				else _m = new Map();
				
				e.evaluations.forEach(
					_e =>
					{
						let levels: evaluation[] = [];
						
						_e.levels.forEach(
							l =>
							{
								levels.push({
									short: l.value.short as evaluationShort,
									long: l.value.long as evaluationLong
								});
							}
						);
						
						_m.set(_e.name, levels);
					}	
				);
				
				map.set(e.name, _m);
			}
		);
	}
	
	let str = "";
	
	map.forEach(
		(_m, key) => 
		{
			str += `${key}: \n`;
			
			_m.forEach(
				(evalNote, evalName) =>
				{
					str += `  ${evalName}: \n`;
					evalNote.forEach(n => str += `   - ${getColor(n.short)}${n.long}\u001b[0m\n`)
				}
			)
		}
	);
	
	console.log(str);
	
	io.write(session.user.name);
	// console.log(map);
	// fs.writeFileSync("./file.json", JSON.stringify(map, replacer, 2));
	
	// console.log((await (await session.marks(pronote.toPronoteDate( new Date('2020-10-03') ))).averages));
}

main().catch(
	err => 
	{
		if(err.code === pronote.errors.WRONG_CREDENTIALS.code) console.log("Mauvais identifiants");
		else console.log(err);
	}
);