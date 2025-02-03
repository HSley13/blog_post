package seeds

import (
	"comment/models"
	"gorm.io/gorm"
	"log"
)

func Seed(db *gorm.DB) {
	db.Exec("DELETE FROM likes")
	db.Exec("DELETE FROM comments")
	db.Exec("DELETE FROM posts")
	db.Exec("DELETE FROM users")

	tony := models.User{Name: "Tony Stark (Iron Man)"}
	steve := models.User{Name: "Steve Rogers (Captain America)"}
	bruce := models.User{Name: "Bruce Wayne (Batman)"}
	clark := models.User{Name: "Clark Kent (Superman)"}
	sley := models.User{Name: "Sley"}

	db.Create(&sley)
	db.Create(&tony)
	db.Create(&steve)
	db.Create(&bruce)
	db.Create(&clark)

	post1 := models.Post{
		Title: "The Rise of Iron Man",
		Body:  "Tony Stark, a genius inventor, builds the Iron Man suit to fight evil and protect the world. His journey from a selfish billionaire to a selfless hero is inspiring.",
	}
	post2 := models.Post{
		Title: "Captain America: The First Avenger",
		Body:  "Steve Rogers, a frail young man, becomes Captain America after taking a super-soldier serum. He leads the fight against Hydra and becomes a symbol of hope.",
	}
	post3 := models.Post{
		Title: "Batman: The Dark Knight",
		Body:  "Bruce Wayne, traumatized by his parents' death, becomes Batman to fight crime in Gotham City. His no-kill rule and detective skills make him one of the greatest heroes.",
	}
	post4 := models.Post{
		Title: "Superman: Man of Steel",
		Body:  "Clark Kent, an alien from Krypton, uses his superpowers to protect Earth as Superman. His struggle to balance his human and Kryptonian heritage is central to his story.",
	}

	db.Create(&post1)
	db.Create(&post2)
	db.Create(&post3)
	db.Create(&post4)

	comment1 := models.Comment{
		Message: "Iron Man is my favorite hero! His tech is amazing.",
		UserID:  tony.ID,
		PostID:  post1.ID,
	}
	comment6 := models.Comment{
		Message:  "Iron Man can single handle Batman",
		UserID:   steve.ID,
		PostID:   post1.ID,
		ParentID: &comment1.ID,
	}
	comment7 := models.Comment{
		Message: "Iron Man's armor is incredible!",
		UserID:  clark.ID,
		PostID:  post1.ID,
	}
	comment8 := models.Comment{
		Message:  "Yeah I really like how He used it when fighting against Thanos",
		UserID:   clark.ID,
		PostID:   post1.ID,
		ParentID: &comment7.ID,
	}
	comment9 := models.Comment{
		Message: "Batman Can solo handle Iron Man",
		UserID:  sley.ID,
		PostID:  post1.ID,
	}
	comment2 := models.Comment{
		Message: "Captain America's shield is iconic!",
		UserID:  steve.ID,
		PostID:  post2.ID,
	}
	comment3 := models.Comment{
		Message: "Batman's no-kill rule is what makes him a true hero.",
		UserID:  bruce.ID,
		PostID:  post3.ID,
	}
	comment4 := models.Comment{
		Message: "Superman's strength and compassion are unmatched.",
		UserID:  clark.ID,
		PostID:  post4.ID,
	}
	comment5 := models.Comment{
		Message:  "I love how Iron Man and Captain America work together in the Avengers!",
		UserID:   tony.ID,
		PostID:   post2.ID,
		ParentID: &comment2.ID,
	}

	db.Create(&comment1)
	db.Create(&comment6)
	db.Create(&comment7)
	db.Create(&comment8)
	db.Create(&comment9)
	db.Create(&comment2)
	db.Create(&comment3)
	db.Create(&comment4)
	db.Create(&comment5)

	log.Println("Database seeded successfully!")
}
