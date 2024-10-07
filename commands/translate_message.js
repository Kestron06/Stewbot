// #region Boilerplate
const { ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandBuilder, Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, ActivityType, PermissionFlagsBits, DMChannel, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType,AuditLogEvent, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageReaction, MessageType}=require("discord.js");
function applyContext(context={}) {
	for (key in context) {
		this[key] = context[key];
	}
}
// #endregion Boilerplate

module.exports = {
	data: {
		// Slash command data
		command: new ContextMenuCommandBuilder().setName("translate_message").setType(ApplicationCommandType.Message),
		
		// Optional fields
		
		extra: {
			"contexts":[0,1,2],"integration_types":[0,1],
			"desc":"Attempt to autodetect the language of a message and translate it"
		},

		requiredGlobals: ["translate", "escapeBackticks"],

		help: {
			helpCategory: "Informational",
			helpDesc: "Translates a word or phrase",
			// helpSortPriority: 1
		},
	},

	async execute(cmd, context) {
		applyContext(context);
		
		translate(cmd.targetMessage.content,{
			to:cmd.locale.slice(0,2)
		}).then(t=>{
			t.text=checkDirty(config.homeServer,t.text,true)[1];
			if(cmd.guildId&&storage[cmd.guildId]?.filter.active) t.text=checkDirty(cmd.guildId,t.text,true)[1];
			cmd.followUp(`Attempted to translate${t.text!==cmd.targetMessage.content?`:\n\`\`\`\n${escapeBackticks(t.text)}\n\`\`\`\n-# If this is incorrect, try using ${cmds.translate.mention}.`:`, but I was unable to. Try using ${cmds.translate.mention}.`}`);
		});
	}
};
