process.env=require("./env.json");
const { REST,Routes,PermissionFlagsBits,SlashCommandBuilder,ContextMenuCommandBuilder,ApplicationCommandType,ChannelType} = require('discord.js');
const fs=require("fs");
const path = require("path")

//Command permissions should be set to the level you would need to do it manually (so if the bot is deleting messages, the permission to set it up would be the permission to delete messages)
//Don't enable anything in DMs that is unusable in DMs (server configurations, multiplayer reliant commands, etc)

//This is a temporary way of specifying what contexts and where the command should appear while we await Discord.js' official implementation
/*
Contexts
0: Normal server usage
1: DMs with the Bot directly
2: User command from anywhere

Integration Types
0: Only as a server command
1: Only as a user command
*/


// Build command info from slash commands
const extraInfo = {};
let commands = []
const migratedCommands = {}
for (file of fs.readdirSync("./commands")) {
    if (path.extname(file) === ".js") {
        const commandName = path.parse(file).name;
        const command = require("./commands/"+commandName)
        migratedCommands[commandName] = command;
    }
}
for (let commandName in migratedCommands) {
	const command = migratedCommands[commandName];
	if (command?.data?.command) {
		commands.push(command.data.command);
	}
	if (command?.data?.extra) {
		extraInfo[commandName] = command.data.extra;
	}
}


// Inject extra data that discord.js doesn't/didn't support natively
commands = commands.map(command => Object.assign(command.toJSON(),extraInfo[command.toJSON().name]));
function launchCommands(){
	// Register
	const rest = new REST({ version: '9' }).setToken(process.env.token);
	var comms={};
	rest.put(Routes.applicationCommands(process.env.clientId),{body:commands}).then(d=>{
		d.forEach(c=>{
			comms[c.name]={
				mention:`</${c.name}:${c.id}>`,
				id:c.id,
				name:c.name,
				description:c.description,
				contexts:c.contexts,
				integration_types:c.integration_types,
				type:c.type,
				default_member_permissions:c.default_member_permissions
			};
			if(c.hasOwnProperty("options")){
				c.options.forEach(o=>{
					if(o.type===1){
						comms[c.name][o.name]={
							mention:`</${c.name} ${o.name}:${c.id}>`,
							id:c.id,
							name:o.name,
							description:o.description,
							contexts:c.contexts,
							integration_types:c.integration_types,
							type:o.type,
							default_member_permissions:c.default_member_permissions
						};
					}
				});
			}
		});
		fs.writeFileSync("./data/commands.json",JSON.stringify(comms));
		console.log("Updated commands on Discord and wrote commands to ./commands.json");
	}).catch(console.error);

	// Register stewbot-devadmin-only commands
	const devadminCommands = [
		new SlashCommandBuilder()
			.setName('restart')
			.setDescription('Restart the bot')
			.addBooleanOption(option=>
				option.setName("update").setDescription("Update git and npm before restarting").setRequired(false)
			)
			.addBooleanOption(option=>
				option.setName("update_commands").setDescription("Run launchCommands.js before restarting").setRequired(false)
			)
	]
	rest.put(
		Routes.applicationGuildCommands(process.env.clientId, "983074750165299250"),
		{ body: devadminCommands },
	);
}

// Run if being run directly
if (require.main == module) {
	launchCommands();
}