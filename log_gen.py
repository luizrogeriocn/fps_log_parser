import random
import datetime
import sys

PLAYERS = ["Roman", "Nick", "Marcus", "Jhon", "Bryan", "Bryian"]
WEAPONS = ["M16", "AK47", "Sniper", "Knife"]
WORLD_CAUSES = ["DROWN", "FALL", "EXPLOSION"]

def generate_log(num_matches: int, avg_kills: int, output_file="game_log.txt"):
    logs = []
    current_time = datetime.datetime.now()

    for m in range(num_matches):
        match_id = random.randint(10_000_000, 99_999_999)

        # Start match
        logs.append(f"{current_time.strftime('%d/%m/%Y %H:%M:%S')} - New match {match_id} has started")
        current_time += datetime.timedelta(minutes=random.randint(1, 5))

        # Number of kills for this match
        kills = max(1, int(random.gauss(avg_kills, avg_kills * 0.3)))  # gaussian spread

        for _ in range(kills):
            if random.random() < 0.1:  # 10% chance world kill
                victim = random.choice(PLAYERS)
                cause = random.choice(WORLD_CAUSES)
                logs.append(f"{current_time.strftime('%d/%m/%Y %H:%M:%S')} - <WORLD> killed {victim} by {cause}")
            else:
                killer, victim = random.sample(PLAYERS, 2)
                weapon = random.choice(WEAPONS)
                logs.append(f"{current_time.strftime('%d/%m/%Y %H:%M:%S')} - {killer} killed {victim} using {weapon}")

            current_time += datetime.timedelta(minutes=random.randint(1, 10))

        # End match
        logs.append(f"{current_time.strftime('%d/%m/%Y %H:%M:%S')} - Match {match_id} has ended")
        current_time += datetime.timedelta(hours=random.randint(1, 24))  # gap between matches

    # Write to file
    with open(output_file, "w") as f:
        f.write("\n".join(logs))

    print(f"Game log written to {output_file}")


if __name__ == "__main__":
    generate_log(num_matches=int(sys.argv[1]), avg_kills=int(sys.argv[2]))
