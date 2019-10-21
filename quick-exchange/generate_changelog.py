import sys 
import os 
import re 
import json
import urllib.request

# Changelog = All commits since TestBranchLastMerge on develop branch
# Major = last tag's major or 0  // Changed manually

# Merge develop > test 
#	Reset Build 
# 	Minor = count merges (Merge develop > test)..HEAD
#	Build == count commits (Merge develop > test)..HEAD   // Hotfixes
# 	Changelog += commits (Merge develop > test)..HEAD	// Hotfixes

# Merge test > master
#	Reset build
# 	Minor = count merges (Merge develop > test)..HEAD 
#	Build == count commits (Merge test > master)..HEAD	// Hotfixes
# 	Changelog += commits (Merge test > master)..HEAD	// Hotfixes


BRANCH_NAMES = {
	"develop": "development",
	"test": "testing",
	"master": "production"
}
PROJECT = "BACKEND_EXCHANGE"
SLACK_WEBHOOK = "https://hooks.slack.com/services/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"

def Exec( Command, Strip=False ):
	Output = os.popen(Command)
	Output.reconfigure(encoding="utf8")
	Output = Output.read().replace("\r","\n").replace("\n\n","\n")
	if Strip:
		Output = Output.replace("\n", "")
	return Output

def GitLog( Command ):
	Log = []
	for Line in Exec(f"git log {Command} --format=\"%H%x00%s%x00%adi\"").split("\n"):
		if not Line: continue
		Hash, Comment, Date = Line.split("\x00")
		Log.append({
			"hash": Hash,
			"comment": Comment,
			"date": Date
		})
	return Log

def Main():

	Branch = Exec("git rev-parse --abbrev-ref HEAD", Strip=True)

	Exec("git checkout test -- && git checkout master -- && git checkout develop --")
	Exec(f"git checkout {Branch} --")

	Version = Exec("git tag --sort=committerdate | tail -n 1", Strip=True) or "0.0.0"

	Major, Minor, Build = Version.split(".")
	Major, Minor, Build = int(Major), 0, 0

	TestBranchMerges = GitLog(f"--first-parent test -- --merges --reverse")
	CurrentBranchMerges = GitLog(f"--first-parent {Branch} -- --merges --reverse")

	Minor = len(TestBranchMerges) + int(Branch=="develop")

	Changelog = ""	

	if Branch == "develop":
		if len(TestBranchMerges) > 0:
			for Change in GitLog(f'{TestBranchMerges[-1]["hash"]}..HEAD --no-merges'):
				Changelog += f' - {Change["comment"]}\n'
				Build += 1

	else:
		if len(TestBranchMerges) > 1:
			for Change in GitLog(f'{TestBranchMerges[-2]["hash"]}..{TestBranchMerges[-1]["hash"]} --no-merges'):
				Changelog += f' - {Change["comment"]}\n'
				if Branch == "develop":
					Build += 1
		
		for Change in GitLog(f'--first-parent {Branch} -- {CurrentBranchMerges[-1]["hash"]}..HEAD --no-merges'):
			Changelog += f' - _Hotfix_: {Change["comment"]}\n'
			Build += 1

	NewVersion = f"{Major}.{Minor}.{Build}"

	# print( Version, NewVersion, Changelog or "No changes" )

	if Branch != "develop":

		Exec(f"git tag -fa {NewVersion} && git push --tags")

		urllib.request.urlopen(urllib.request.Request(SLACK_WEBHOOK,json.dumps({
			"attachments": [
				{
					"color": "#32db04",
					"title": f"{PROJECT}: Released version {NewVersion} on {BRANCH_NAMES[Branch]}",
					"text": Changelog,
					"footer": f"Previous version: {Version}",
				}
			]
		}).encode("utf8"),{"Content-Type": "application/json"}))

		print(NewVersion)


if __name__ == "__main__":
	Main()