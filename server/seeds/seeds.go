package seeds

import (
	"blog_post/models"
	"gorm.io/gorm"
	"os"
)

func Seed(db *gorm.DB) {
	db.Exec("DELETE FROM likes")
	db.Exec("DELETE FROM comments")
	db.Exec("DELETE FROM post_tags")
	db.Exec("DELETE FROM posts")
	db.Exec("DELETE FROM tags")
	db.Exec("DELETE FROM users")

	users := []models.User{
		{FirstName: "Tony", LastName: "STARK", Email: "tonystark@gmail.com", HashPassword: os.Getenv("HASH"), Image: os.Getenv("ironman_icon")},
		{FirstName: "Steve", LastName: "ROGERS", Email: "steverogers@gmail.com", HashPassword: os.Getenv("HASH"), Image: os.Getenv("captain_icon")},
		{FirstName: "Bruce", LastName: "WAYNE", Email: "brucewayne@gmail.com", HashPassword: os.Getenv("HASH"), Image: os.Getenv("batman_icon")},
		{FirstName: "Clark", LastName: "KENT", Email: "clarkkent@gmail.com", HashPassword: os.Getenv("HASH"), Image: os.Getenv("superman_icon")},
		{FirstName: "Sley", LastName: "HORTES", Email: "sleyhortes13@gmail.com", HashPassword: os.Getenv("HASH"), Image: os.Getenv("gojo_icon")},
	}
	db.Create(&users)

	posts := []models.Post{
		{
			UserID: users[0].ID,
			Title:  "The Rise of Iron Man",
			Body:   "A genius billionaire with a heart of steel, Tony Stark builds a suit of armor to protect the world, using his tech genius and unshakable will. With a sarcastic edge and a drive to improve, he’s the ultimate tech-powered superhero.",
			Image:  os.Getenv("ironman_icon"),
			Likes: []models.PostLike{
				{UserID: users[1].ID},
				{UserID: users[2].ID},
			},
		},
		{
			UserID: users[1].ID,
			Title:  "Captain America: The First Avenger",
			Body:   "A super soldier with unwavering moral integrity, Steve Rogers is the symbol of bravery and patriotism. Armed with his indestructible shield, he leads with honor, fighting for justice and equality in a world that needs hope.",
			Image:  os.Getenv("captain_icon"),
			Likes: []models.PostLike{
				{UserID: users[0].ID},
				{UserID: users[2].ID},
			},
		},
		{
			UserID: users[4].ID,
			Title:  "Batman: The Dark Knight",
			Body:   "The Dark Knight, Bruce Wayne, fights crime in Gotham City using his intellect, martial arts prowess, and advanced technology. Haunted by the death of his parents, he’s a brooding, relentless vigilante who believes in justice over vengeance.",
			Image:  os.Getenv("batman_icon"),
			Likes: []models.PostLike{
				{UserID: users[0].ID},
				{UserID: users[1].ID},
			},
		},
		{
			UserID: users[3].ID,
			Title:  "Superman: Man of Steel",
			Body:   " The Man of Steel, Clark Kent is an alien with superhuman powers, including flight, strength, and heat vision. Raised as a symbol of hope and justice, he’s the ultimate protector of Earth, embodying the ideals of truth, justice, and the American way.",
			Image:  os.Getenv("superman_icon"),
			Likes: []models.PostLike{
				{UserID: users[0].ID},
				{UserID: users[1].ID},
			},
		},
	}
	db.Create(&posts)

	tags := []models.Tag{
		{Name: "Marvel"},
		{Name: "Superhero"},
		{Name: "DC"},
	}
	db.Create(&tags)

	postTags := []models.PostTag{
		{PostID: posts[0].ID, TagID: tags[0].ID},
		{PostID: posts[0].ID, TagID: tags[1].ID},
		{PostID: posts[1].ID, TagID: tags[0].ID},
		{PostID: posts[1].ID, TagID: tags[1].ID},
		{PostID: posts[2].ID, TagID: tags[1].ID},
		{PostID: posts[2].ID, TagID: tags[2].ID},
		{PostID: posts[3].ID, TagID: tags[1].ID},
		{PostID: posts[3].ID, TagID: tags[2].ID},
	}
	db.Create(&postTags)

	mainComments := []models.Comment{
		{Message: "Iron Man is my favorite hero!", UserID: users[4].ID, PostID: posts[0].ID},
		{Message: "Iron Man's tech is amazing!", UserID: users[1].ID, PostID: posts[0].ID},

		{Message: "Captain America's shield is iconic!", UserID: users[1].ID, PostID: posts[1].ID},
		{Message: "His values are unmatched.", UserID: users[2].ID, PostID: posts[1].ID},

		{Message: "Batman's dark knight is the best!", UserID: users[4].ID, PostID: posts[2].ID},
		{Message: "The bat symbol is so iconic!", UserID: users[0].ID, PostID: posts[2].ID},

		{Message: "Superman's strength is unmatched!", UserID: users[3].ID, PostID: posts[3].ID},
		{Message: "He's faster than a speeding bullet!", UserID: users[0].ID, PostID: posts[3].ID},
	}
	db.Create(&mainComments)

	nestedComments := []models.Comment{
		{Message: "I agree, his suit is top-notch.", UserID: users[2].ID, PostID: posts[0].ID, ParentID: &mainComments[0].ID},
		{Message: "He's a genius inventor!", UserID: users[4].ID, PostID: posts[0].ID, ParentID: &mainComments[0].ID},

		{Message: "Best weapon ever!", UserID: users[0].ID, PostID: posts[1].ID, ParentID: &mainComments[2].ID},
		{Message: "I love his dedication to justice.", UserID: users[3].ID, PostID: posts[1].ID, ParentID: &mainComments[2].ID},

		{Message: "He is the best detective!", UserID: users[3].ID, PostID: posts[2].ID, ParentID: &mainComments[4].ID},
		{Message: "Gotham needs him!", UserID: users[4].ID, PostID: posts[2].ID, ParentID: &mainComments[4].ID},

		{Message: "Superman's heat vision is incredible.", UserID: users[1].ID, PostID: posts[3].ID, ParentID: &mainComments[6].ID},
		{Message: "The Man of Steel never gives up.", UserID: users[2].ID, PostID: posts[3].ID, ParentID: &mainComments[6].ID},
	}
	db.Create(&nestedComments)
}
