import { BACKEND_PORT } from './config.js';
import { fileToDataUrl } from './helpers.js';

document.addEventListener('DOMContentLoaded', () => {
    const startContainer = document.querySelector('.custom-container');
    const dashboardContainer = document.querySelector('.dashboard-container');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const logoutButton = document.getElementById('logout-button');
    const noneForm = document.getElementById('none-form');
    const newTopic = document.getElementById('new-topic');
    const createTopic = document.getElementById('create-topic');
    const postCancel = document.getElementById('post-cancel');
    const postSubmit = document.getElementById('post-submit');
    const loadMoreButton = document.getElementById('load-more');
    const threadsList = document.querySelector('.threads-list');
    const threadDetails = document.getElementById('thread-details');
    const editThreadSection = document.getElementById('edit-thread');
    const buttonEdit = document.getElementById('button-edit');
    const editDetails = document.getElementById('edit-details');
    const editPart = document.getElementById('edit-part');
    const editButton = document.getElementById('thread-edit');
    const deleteButton = document.getElementById('thread-delete');
    const saveButton = document.getElementById('thread-save');
    const editTitle = document.getElementById('edit-title');
    const editContent = document.getElementById('edit-content');
    const editPrivate = document.getElementById('edit-public');
    const editLock = document.getElementById('edit-lock');
    const profileScreen = document.getElementById('profile-screen');
    const userProfilePic = document.getElementById('userprofile-pic');
    const updateModal = document.getElementById('update-profile-modal');

    threadDetails.style.display = 'none';

    let threadIds = [];
    let threadsDisplayed = 0;
    let start = 0;
    let currentThread = null;

    // Load posts from the backend database
    const loadThreads = (reset = false) => {
        if (reset) {
            const threadBoxes = threadsList.querySelectorAll('.thread-box');
            threadBoxes.forEach(box => box.remove());
            threadsDisplayed = 0;
            start = 0;
            threadIds = [];
        }

        const token = localStorage.getItem('authToken');

        fetch(`http://localhost:5005/threads?start=${start}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    return Promise.reject('Failed to load thread IDs.');
                }
                return response.json();
            })
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    threadIds = threadIds.concat(data);
                    localStorage.setItem('threadIds', JSON.stringify(threadIds));
                    displayNextThreads(5);
                    start += data.length;

                    if (data.length < 5) {
                        loadMoreButton.style.display = 'none';
                    } else {
                        loadMoreButton.style.display = 'block';
                    }
                } else {
                    loadMoreButton.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error loading threads:', error);
                showErrorPopup(error);
            });
    };

    // Display all comments on the post detail page for the currently logged-in user
    const fetchComments1 = (threadId, threadlock) => {
        const token = localStorage.getItem('authToken');

        fetch(`http://localhost:5005/comments?threadId=${threadId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    return Promise.reject('Failed to load comments');
                }
                return response.json();
            })
            .then(comments => {
                comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                const commentContainer1 = document.getElementById('comment-container1');

                while (commentContainer1.firstChild) {
                    commentContainer1.removeChild(commentContainer1.firstChild);
                }

                const nestedComments = nestComments(comments);
                renderComments(nestedComments, commentContainer1);

                document.getElementById('edit-details').appendChild(commentContainer1);

                const newcommentContainer1 = document.getElementById('newcomment-container1');
                while (newcommentContainer1.firstChild) {
                    newcommentContainer1.removeChild(newcommentContainer1.firstChild);
                }

                if (!threadlock) {
                    const newCommentBox = createNewCommentBox(threadId);
                    newcommentContainer1.appendChild(newCommentBox);
                }
                document.getElementById('edit-details').appendChild(newcommentContainer1);
            })
            .catch(error => {
                console.error('Error fetching comments:', error);
            });
    };

    // Display all comments on the post detail page for a non-currently logged-in user
    const fetchComments2 = (threadId, threadlock) => {
        const token = localStorage.getItem('authToken');

        fetch(`http://localhost:5005/comments?threadId=${threadId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    return Promise.reject('Failed to load comments');
                }
                return response.json();
            })
            .then(comments => {
                comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                const commentContainer2 = document.getElementById('comment-container2');

                while (commentContainer2.firstChild) {
                    commentContainer2.removeChild(commentContainer2.firstChild);
                }

                const nestedComments = nestComments(comments);
                renderComments(nestedComments, commentContainer2);
                document.getElementById('thread-details').appendChild(commentContainer2);

                const newcommentContainer2 = document.getElementById('newcomment-container2');

                while (newcommentContainer2.firstChild) {
                    newcommentContainer2.removeChild(newcommentContainer2.firstChild);
                }

                if (!threadlock) {
                    const newCommentBox = createNewCommentBox(threadId);
                    newcommentContainer2.appendChild(newCommentBox);
                }
                document.getElementById('thread-details').appendChild(newcommentContainer2);
            })
            .catch(error => {
                console.error('Error fetching comments:', error);
            });
    };

    let isProfileLoading = false;
    // Display the profile of the viewed account
    const showUserProfile = (userId) => {
        if (isProfileLoading) return;
        isProfileLoading = true;

        const editButton = document.getElementById('edit-profile-button');
        const currentUserId = localStorage.getItem('userId');
        const whetheradmin = localStorage.getItem('isAdmin');
        const userpassword = localStorage.getItem('userPassword');

        profileScreen.style.display = 'flex';
        newTopic.style.display = 'none';
        threadDetails.style.display = 'none';
        editThreadSection.style.display = 'none';

        const profilePic = document.getElementById('profilescreen-pic');
        const profileName = document.getElementById('profilescreen-name');
        const profileEmail = document.getElementById('profilescreen-email');
        const profileAdmin = document.getElementById('profilescreen-admin');
        const userThreadsContainer = document.getElementById('user-threads');

        while (userThreadsContainer.firstChild) {
            userThreadsContainer.removeChild(userThreadsContainer.firstChild);
        }

        fetchUserDetails(userId)
            .then(({ userImage, userName, userEmail, userAdmin }) => {
                profilePic.src = userImage;
                profileName.textContent = userName;
                profileEmail.textContent = `Email: ${userEmail}`;
                profileAdmin.textContent = `Admin: ${userAdmin}`;

                // Allow editing of the profile if it belongs to the currently logged-in user or the current user is an admin
                if (userId === Number(currentUserId) || userId === currentUserId || whetheradmin === 'true') {
                    setupEditButton(userId, userImage, userName, userEmail, userpassword, userAdmin, whetheradmin);
                } else {
                    editButton.style.display = 'none';
                }
                return loadAllThreads(userId);
            })
            .then(userthreads => {
                userthreads.forEach(thread => {
                    fetchCommentCount(thread.id).then(commentCount => {
                        const threadElement = createThreadElement(thread, commentCount);
                        userThreadsContainer.appendChild(threadElement);
                    });
                });
            })
            .catch(error => {
                console.error('Error loading user profile:', error.message);
            })
            .finally(() => {
                isProfileLoading = false;
            });
    };

    // Format for displaying the user's threads on the profile page
    const createThreadElement = (thread, commentCount) => {
        const threadElement = document.createElement('div');
        threadElement.classList.add('user-thread');

        const title = document.createElement('h4');
        title.textContent = thread.title;

        const content = document.createElement('p');
        content.textContent = thread.content;

        const likes = document.createElement('p');
        likes.textContent = `Likes: ${thread.likes.length}`;

        const comments = document.createElement('p');
        comments.textContent = `Comments: ${commentCount}`;

        threadElement.appendChild(title);
        threadElement.appendChild(content);
        threadElement.appendChild(likes);
        threadElement.appendChild(comments);

        return threadElement;
    };

    // Navigate to the profile details edit page
    const setupEditButton = (currentUserId, userImage, userName, userEmail, userPassword, userAdmin, whetheradmin) => {
        const editButton = document.getElementById('edit-profile-button');
        const updateModal = document.getElementById('update-profile-modal');
        const currentImage = document.getElementById('current-profile-image');
        const imageInput = document.getElementById('update-image');
        const roleSection = document.getElementById('role-section');
        const roleDropdown = document.getElementById('user-role');
        const roleUpdateButton = document.getElementById('update-role');
        const token = localStorage.getItem('authToken');

        // Show the admin-user toggle option if the current user is an admin; otherwise, hide it
        if (whetheradmin !== 'true') {
            roleSection.style.display = 'none';
        } else {
            roleSection.style.display = 'block';
        }

        roleDropdown.value = userAdmin ? 'admin' : 'user';

        editButton.style.display = 'block';

        // Edit the details of the profile
        editButton.onclick = function () {
            profileScreen.style.display = 'none';
            updateModal.style.display = 'block';

            document.getElementById('update-email').value = userEmail;
            document.getElementById('update-name').value = userName;
            document.getElementById('update-password').value = userPassword;
            currentImage.src = userImage;
            imageInput.value = '';

            imageInput.onchange = function (event) {
                const file = event.target.files[0];
                if (!file) return;

                fileToDataUrl(file).then(dataUrl => {
                    currentImage.src = dataUrl;
                }).catch(error => {
                    console.error('Error loading new image:', error.message);
                });
            };
        };

        // Update whether the user is an admin or a regular user
        roleUpdateButton.onclick = function () {
            const newRole = roleDropdown.value === 'admin';
            fetch(`http://localhost:5005/user/admin`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId: currentUserId, turnon: newRole })
            })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(errorData => {
                            console.error('Role update failed:', errorData);
                            alert('Failed to update role');
                            throw new Error('Role update failed');
                        });
                    }
                    alert('Role updated successfully!');
                    updateModal.style.display = 'none';
                    showUserProfile(localStorage.getItem('userId'));
                })
                .catch(error => {
                    console.error('Error updating role:', error.message);
                });
        };

        // Sync the updates to the backend database
        document.getElementById('profile-update').onclick = function (event) {
            event.preventDefault();

            const newEmail = document.getElementById('update-email').value;
            const newName = document.getElementById('update-name').value;
            const newPassword = document.getElementById('update-password').value;
            const updateData = {};

            if (newEmail !== userEmail) updateData.email = newEmail;
            if (newName !== userName) updateData.name = newName;
            if (newPassword !== userPassword) updateData.password = newPassword;
            if (currentImage.src !== userImage) updateData.image = currentImage.src;

            fetch(`http://localhost:5005/user`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(errorData => {
                            console.error('Profile update failed:', errorData);
                            alert('Failed to update profile');
                            throw new Error('Profile update failed');
                        });
                    }
                    if (newPassword !== userPassword) {
                        alert('Password changed. Please log in again.');
                        localStorage.clear();
                        dashboardContainer.style.display = 'none';
                        startContainer.style.display = 'block';
                        updateModal.style.display = 'none';
                    } else {
                        updateModal.style.display = 'none';
                        showUserProfile(localStorage.getItem('userId'));
                    }
                })
                .catch(error => {
                    console.error('Error updating profile:', error.message);
                });
        };

        document.getElementById('cancel-update').onclick = () => {
            updateModal.style.display = 'none';
            showUserProfile(localStorage.getItem('userId'));
        };
    };

    // Retrieve all posts belonging to the current user from the backend database
    const loadAllThreads = (userId) => {
        let allThreadIds = [];
        let start = 0;
        const token = localStorage.getItem('authToken');

        function fetchThreadsBatch() {
            return fetch(`http://localhost:5005/threads?start=${start}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }).then(response => {
                if (!response.ok) {
                    console.error('Failed to load thread IDs');
                    return Promise.reject('Failed to load thread IDs');
                }
                return response.json();
            });
        }

        // Retrieve all posts from the database
        function fetchAllThreadsRecursively() {
            return fetchThreadsBatch().then(data => {
                allThreadIds = allThreadIds.concat(data);
                start += data.length;
                if (data.length === 5) {
                    return fetchAllThreadsRecursively();
                }
            });
        }

        return fetchAllThreadsRecursively()
            .then(() => getUserThreads(allThreadIds, Number(userId)))
            .catch(error => {
                console.error('Error loading all threads:', error);
                return [];
            });
    };

    // Retrieve the posts belonging to the current user from all posts
    const getUserThreads = (threadIds, userId) => {
        const token = localStorage.getItem('authToken');
        const userThreads = [];

        function fetchThread(threadId) {
            return fetch(`http://localhost:5005/thread?id=${threadId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }).then(response => {
                if (!response.ok) {
                    console.warn(`Failed to load thread with ID: ${threadId}`);
                    return null;
                }
                return response.json();
            }).catch(error => {
                console.error(`Error fetching thread ${threadId}:`, error.message);
                return null;
            });
        }

        const threadPromises = threadIds.map(threadId =>
            fetchThread(threadId).then(thread => {
                if (thread && thread.creatorId === userId) {
                    userThreads.push(thread);
                }
            })
        );

        return Promise.all(threadPromises).then(() => userThreads);
    };

    // Retrieve the number of comments on a post
    const fetchCommentCount = (threadId) => {
        const token = localStorage.getItem('authToken');

        return fetch(`http://localhost:5005/comments?threadId=${threadId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    console.warn(`Failed to fetch comments for thread ${threadId}`);
                    return 0;
                }
                return response.json();
            })
            .then(comments => comments.length)
            .catch(error => {
                console.error(`Error fetching comments for thread ${threadId}:`, error.message);
                return 0;
            });
    };

    // Organize comments into a nested structure by associating each comment with its child comments based on parentCommentId
    const nestComments = (comments) => {
        const commentMap = new Map();
        comments.forEach(comment => commentMap.set(comment.id, { ...comment, children: [] }));

        const nestedComments = [];
        commentMap.forEach(comment => {
            if (comment.parentCommentId) {
                const parent = commentMap.get(comment.parentCommentId);
                if (parent) {
                    parent.children.push(comment);
                    parent.children.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                }
            } else {
                nestedComments.push(comment);
            }
        });
        return nestedComments;
    };

    // Place comments and their child comments into a container for display on the interface
    const renderComments = (comments, container, level = 0) => {
        const promises = comments.map(comment => {
            return createCommentElement(comment, level).then(commentElement => {
                container.appendChild(commentElement);

                if (comment.children && comment.children.length > 0) {
                    const childrenContainer = document.createElement('div');
                    renderComments(comment.children, childrenContainer, level + 1)
                        .then(() => container.appendChild(childrenContainer));
                }
            });
        });

        return Promise.all(promises);
    };

    // Create a new comment
    const createNewCommentBox = (threadId) => {
        const newCommentContainer = document.createElement('div');
        newCommentContainer.classList.add('make-comment');

        const textarea = document.createElement('textarea');
        textarea.classList.add('comment-textarea');
        textarea.placeholder = 'Add your comment';

        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('newcomment-button');

        const postButton = document.createElement('button');
        postButton.classList.add('newcomment-post-button');
        postButton.textContent = 'Comment';

        const cancelButton = document.createElement('button');
        cancelButton.classList.add('newcomment-cancel-button');
        cancelButton.textContent = 'Cancel';

        buttonContainer.appendChild(postButton);
        buttonContainer.appendChild(cancelButton);

        newCommentContainer.appendChild(textarea);
        newCommentContainer.appendChild(buttonContainer);

        // Post a new comment
        postButton.addEventListener('click', () => {
            const newComment = textarea.value.trim();
            if (newComment) {
                const token = localStorage.getItem('authToken');
                const requestBody = {
                    content: newComment,
                    threadId: threadId,
                    parentCommentId: null
                };

                fetch(`http://localhost:5005/comment`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Failed to post new comment');
                        }
                        textarea.value = '';
                        loadThreads(true);
                        return fetch(`http://localhost:5005/thread?id=${threadId}`, {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                    })
                    .then(threadResponse => {
                        if (!threadResponse.ok) {
                            throw new Error('Failed to load thread details.');
                        }
                        return threadResponse.json();
                    })
                    .then(thread => {
                        const whetheradmin = localStorage.getItem('isAdmin');
                        if (thread.creatorId === Number(localStorage.getItem('userId')) || whetheradmin === 'true') {
                            showEditForm(thread);
                        } else {
                            displayThreadDetails(thread);
                        }
                    })
                    .catch(error => {
                        console.error('Error posting comment:', error.message);
                    });
            } else {
                alert('Comment cannot be empty');
            }
        });

        cancelButton.addEventListener('click', () => {
            textarea.value = '';
        });
        return newCommentContainer;
    };

    // Retrieve user information
    const fetchUserDetails = (userId) => {
        const token = localStorage.getItem('authToken');
        return fetch(`http://localhost:5005/user?userId=${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch user details');
                }
                return response.json();
            })
            .then(userData => {
                return {
                    userImage: userData.image || 'assets/default-profile.png',
                    userName: userData.name,
                    userEmail: userData.email,
                    userAdmin: userData.admin
                };
            })
            .catch(error => {
                console.error('Error fetching user details:', error.message);
                return {
                    userImage: 'assets/default-profile.png',
                    userName: 'Unknown User',
                    userEmail: 'N/A',
                    userAdmin: false
                };
            });
    };

    // Create the styling for a comment
    const createCommentElement = (comment, level = 0) => {
        const commentElement = document.createElement('div');
        commentElement.classList.add('comment');
        commentElement.style.marginLeft = `${level * 2}rem`;

        return fetchUserDetails(comment.creatorId).then(({ userImage, userName }) => {
            const profileContainer = document.createElement('div');
            profileContainer.classList.add('profile-container');

            const profilePic = document.createElement('img');
            profilePic.src = userImage;
            profilePic.alt = `${comment.creatorId} profile`;
            profilePic.classList.add('profile-pic');

            const profileName = document.createElement('span');
            profileName.textContent = userName;
            profileName.classList.add('profile-name');
            profileName.style.cursor = 'pointer';
            profileName.addEventListener('click', () => showUserProfile(comment.creatorId));

            profileContainer.appendChild(profilePic);
            profileContainer.appendChild(profileName);

            const content = document.createElement('div');
            const likeContentContainer = document.createElement('div');
            likeContentContainer.classList.add('comment-likecontent');

            const likeIcon = document.createElement('img');
            likeIcon.src = 'assets/like1.svg';
            likeIcon.alt = 'like-icon';
            likeIcon.classList.add('comment-like-icon');

            const contentText = document.createElement('p');
            contentText.textContent = comment.content;

            likeContentContainer.appendChild(likeIcon);
            likeContentContainer.appendChild(contentText);

            const commentLikes = document.createElement('span');
            commentLikes.classList.add('comment-likes');
            commentLikes.textContent = `likes: ${comment.likes.length}`;

            const commentTime = document.createElement('span');
            commentTime.classList.add('comment-time');
            commentTime.textContent = formatTimeSince(comment.createdAt);

            content.appendChild(likeContentContainer);
            content.appendChild(commentLikes);
            content.appendChild(commentTime);

            const editDeleteContainer = document.createElement('div');
            editDeleteContainer.classList.add('editcomment-container');

            const replyButton = document.createElement('button');
            replyButton.classList.add('reply-button');
            replyButton.textContent = 'Reply';
            replyButton.addEventListener('click', () => showReplyModal(comment.id, comment.threadId));
            editDeleteContainer.appendChild(replyButton);

            commentElement.appendChild(profileContainer);
            commentElement.appendChild(content);

            const userId = Number(localStorage.getItem('userId'));
            const whetheradmin = localStorage.getItem('isAdmin');

            // Display the edit and delete buttons for a comment if the current user is the comment creator or an admin
            if (userId === comment.creatorId || whetheradmin === 'true') {
                const editButton = document.createElement('button');
                editButton.classList.add('editcomment-button');
                editButton.textContent = 'Edit';
                editButton.addEventListener('click', () => showEditModal(comment));

                const deleteButton = document.createElement('button');
                deleteButton.classList.add('deletecomment-button');
                deleteButton.textContent = 'Delete';
                deleteButton.addEventListener('click', () => deleteComment(comment.id, commentElement));

                editDeleteContainer.appendChild(editButton);
                editDeleteContainer.appendChild(deleteButton);
            }

            content.appendChild(editDeleteContainer);

            let liked = comment.likes.includes(userId);
            likeIcon.src = liked ? 'assets/like2.svg' : 'assets/like1.svg';
            let numberLike = comment.likes.length;

            likeIcon.addEventListener('click', () => {
                const token = localStorage.getItem('authToken');
                fetch(`http://localhost:5005/comment/like`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ id: comment.id, turnon: !liked })
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Failed to update like state');
                        }

                        liked = !liked;
                        numberLike += liked ? 1 : -1;
                        likeIcon.src = liked ? 'assets/like2.svg' : 'assets/like1.svg';
                        commentLikes.textContent = `likes: ${numberLike}`;
                    })
                    .catch(error => console.error('Error toggling like state:', error.message));
            });

            return commentElement;
        });
    };

    // Comment editing interface
    const showEditModal = (comment) => {
        const modal = document.createElement('div');
        modal.classList.add('edit-modal');

        const modalContent = document.createElement('div');
        modalContent.classList.add('modal-content');

        const textarea = document.createElement('textarea');
        textarea.classList.add('edit-textarea');
        textarea.textContent = comment.content;

        const modalButtons = document.createElement('div');
        modalButtons.classList.add('modal-buttons');

        const updateButton = document.createElement('button');
        updateButton.classList.add('modal-update-button');
        updateButton.textContent = 'Update';

        const cancelButton = document.createElement('button');
        cancelButton.classList.add('modal-cancel-button');
        cancelButton.textContent = 'Cancel';

        modalButtons.appendChild(updateButton);
        modalButtons.appendChild(cancelButton);

        modalContent.appendChild(textarea);
        modalContent.appendChild(modalButtons);
        modal.appendChild(modalContent);

        document.body.appendChild(modal);

        updateButton.addEventListener('click', () => {
            const updatedContent = textarea.value.trim();
            if (!updatedContent) {
                alert('Comment cannot be empty');
                return;
            }

            const token = localStorage.getItem('authToken');
            fetch(`http://localhost:5005/comment`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: comment.id, content: updatedContent })
            })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(error => {
                            throw new Error('Failed to update comment: ' + error.message);
                        });
                    }
                    modal.remove();
                    return loadThreads(true);
                })
                .then(() => {
                    const token = localStorage.getItem('authToken');
                    return fetch(`http://localhost:5005/thread?id=${comment.threadId}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to load thread details.');
                    }
                    return response.json();
                })
                .then(thread => {
                    const userId = Number(localStorage.getItem('userId'));
                    const whetheradmin = localStorage.getItem('isAdmin');
                    if (thread.creatorId === userId || whetheradmin === 'true') {
                        showEditForm(thread);
                    } else {
                        displayThreadDetails(thread);
                    }
                })
                .catch(error => console.error('Error updating comment:', error.message));
        });

        cancelButton.addEventListener('click', () => {
            modal.remove();
        });
    };

    // Comment reply interface
    const showReplyModal = (parentCommentId, threadId) => {
        const modal = document.createElement('div');
        modal.classList.add('reply-modal');

        const modalContent = document.createElement('div');
        modalContent.classList.add('modal-content');

        const textarea = document.createElement('textarea');
        textarea.classList.add('reply-textarea');
        textarea.placeholder = 'Please add your reply';

        const modalButtons = document.createElement('div');
        modalButtons.classList.add('modal-buttons');

        const commentButton = document.createElement('button');
        commentButton.classList.add('modal-comment-button');
        commentButton.textContent = 'Comment';

        const cancelButton = document.createElement('button');
        cancelButton.classList.add('modal-cancel-button');
        cancelButton.textContent = 'Cancel';

        modalButtons.appendChild(commentButton);
        modalButtons.appendChild(cancelButton);

        modalContent.appendChild(textarea);
        modalContent.appendChild(modalButtons);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        commentButton.addEventListener('click', () => {
            const newComment = textarea.value.trim();
            if (!newComment) {
                alert('Reply cannot be empty');
                return;
            }

            const token = localStorage.getItem('authToken');
            const requestBody = {
                content: newComment,
                threadId: threadId,
                parentCommentId: parentCommentId
            };

            fetch(`http://localhost:5005/comment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(error => {
                            throw new Error('Failed to post new comment: ' + error.message);
                        });
                    }
                    alert('Reply posted successfully!');
                    modal.remove();
                })
                .catch(error => {
                    console.error('Error posting reply:', error.message);
                });
        });

        cancelButton.addEventListener('click', () => {
            modal.remove();
        });
    };

    // Delete a comment
    const deleteComment = (commentId, commentElement) => {
        const token = localStorage.getItem('authToken');

        fetch(`http://localhost:5005/comment`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: commentId })
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(error => {
                        throw new Error('Failed to delete comment: ' + error.message);
                    });
                }
                commentElement.remove();
            })
            .catch(error => {
                console.error('Error deleting comment:', error.message);
            });
    };

    // Calculate the time since the post or comment was published
    const formatTimeSince = (timestamp) => {
        const now = new Date();
        const timePosted = new Date(timestamp);
        const seconds = Math.floor((now - timePosted) / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);

        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes} minute(s) ago`;
        if (hours < 24) return `${hours} hour(s) ago`;
        if (days < 7) return `${days} day(s) ago`;
        return `${weeks} week(s) ago`;
    };

    // Display the detailed content of a post from current user
    const showEditForm = (thread) => {
        currentThread = thread;
        let liked = false;
        let watching = false;

        const threadcreatorpic1 = document.getElementById('thread-creator-pic1');
        const threadcreatorname1 = document.getElementById('thread-creator-name1');
        fetchUserDetails(thread.creatorId)
            .then(({ userImage, userName }) => {
                threadcreatorpic1.src = userImage;
                threadcreatorname1.textContent = userName;

                threadcreatorname1.style.cursor = 'pointer';
                threadcreatorname1.addEventListener('click', () => showUserProfile(thread.creatorId));
            })
            .catch(error => {
                console.error('Error displaying user image:', error.message);
                threadcreatorpic1.src = 'assets/default-profile.png';
            });


        const likeIcon1 = document.getElementById('like-icon1');
        const eyeIcon1 = document.getElementById('eye-icon1');
        const userId = Number(localStorage.getItem('userId'));
        const allLikes = thread.likes;
        const allwatchs = thread.watchees;
        if (allLikes.includes(userId)) {
            liked = true;
            likeIcon1.src = 'assets/like2.svg';
            likeIcon1.alt = 'like-icon2';
        } else {
            likeIcon1.src = 'assets/like1.svg';
            likeIcon1.alt = 'like-icon1';
        }
        if (allwatchs.includes(userId)) {
            watching = true;
            eyeIcon1.src = 'assets/eye2.svg';
            eyeIcon1.alt = 'eye-icon2';
        } else {
            eyeIcon1.src = 'assets/eye1.svg';
            eyeIcon1.alt = 'eye-icon1';
        }
        document.getElementById('thread-title1').textContent = thread.title;
        document.getElementById('thread-content1').textContent = thread.content;
        document.getElementById('thread-likes1').textContent = `likes: ${Object.keys(thread.likes).length}`;
        let numberLike = Object.keys(thread.likes).length;
        threadDetails.style.display = 'none';
        noneForm.style.display = 'none';
        newTopic.style.display = 'none';
        editThreadSection.style.display = 'block';
        buttonEdit.style.display = 'flex';
        editDetails.style.display = 'flex';
        editPart.style.display = 'none';
        profileScreen.style.display = 'none';
        if (thread.lock === true) {
            editButton.style.display = 'none';
        } else {
            editButton.style.display = 'flex';
        }

        fetchComments1(thread.id, thread.lock);

        likeIcon1.replaceWith(likeIcon1.cloneNode(true));
        eyeIcon1.replaceWith(eyeIcon1.cloneNode(true));
        const newLikeIcon1 = document.getElementById('like-icon1');
        const neweyeIcon1 = document.getElementById('eye-icon1');

        // Like button logic
        if (thread.lock === true) {
            newLikeIcon1.style.cursor = 'not-allowed';
        } else {
            newLikeIcon1.addEventListener('click', () => {
                const token = localStorage.getItem('authToken');
                const threadId = thread.id;

                fetch(`http://localhost:5005/thread/like`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: threadId,
                        turnon: !liked
                    })
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Failed to update like state');
                        }

                        if (liked) {
                            numberLike = numberLike - 1;
                            newLikeIcon1.src = 'assets/like1.svg';
                            newLikeIcon1.alt = 'like-icon1';
                        } else {
                            numberLike = numberLike + 1;
                            newLikeIcon1.src = 'assets/like2.svg';
                            newLikeIcon1.alt = 'like-icon2';
                        }

                        liked = !liked;
                        loadThreads(true);
                        document.getElementById('thread-likes1').textContent = `${numberLike}`;
                    })
                    .catch(error => {
                        console.error('Error toggling like state:', error.message);
                    });
            });
        }

        // Watch button logic
        if (thread.lock === true) {
            neweyeIcon1.style.cursor = 'not-allowed';
        } else {
            neweyeIcon1.addEventListener('click', () => {
                const token = localStorage.getItem('authToken');
                const threadId = thread.id;

                fetch(`http://localhost:5005/thread/watch`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: threadId,
                        turnon: !watching
                    })
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Failed to update watch state');
                        }

                        if (watching) {
                            neweyeIcon1.src = 'assets/eye1.svg';
                            neweyeIcon1.alt = 'eye-icon1';
                        } else {
                            neweyeIcon1.src = 'assets/eye2.svg';
                            neweyeIcon1.alt = 'eye-icon2';
                        }
                        watching = !watching;
                        loadThreads(true);
                    })
                    .catch(error => {
                        console.error('Error toggling watch state:', error.message);
                    });
            });
        }
        editButton.addEventListener('click', openEditForm, { once: true });
        deleteButton.addEventListener('click', () => deleteThread(currentThread.id), { once: true });
    };

    // Open the post editing interface
    const openEditForm = () => {
        editTitle.value = currentThread.title;
        editContent.value = currentThread.content;
        editPrivate.checked = !currentThread.isPublic;
        editLock.checked = currentThread.lock !== undefined ? currentThread.lock : false;

        editDetails.style.display = 'none';
        editPart.style.display = 'block';
        saveButton.addEventListener('click', saveThread);
    };

    // Save the changes to the post
    const saveThread = (event) => {
        event.preventDefault();

        const updatedTitle = editTitle.value;
        const updatedContent = editContent.value;
        const isPublic = !editPrivate.checked;
        const isLocked = editLock.checked;
        const token = localStorage.getItem('authToken');

        fetch(`http://localhost:5005/thread`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: currentThread.id,
                title: updatedTitle,
                content: updatedContent,
                isPublic: isPublic,
                lock: isLocked
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to update thread');
                }
                return loadThreads(true);
            })
            .then(() => {
                const userid = localStorage.getItem('userId');
                return fetch(`http://localhost:5005/thread?id=${currentThread.id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            })
            .then(threadResponse => {
                if (!threadResponse.ok) {
                    throw new Error('Failed to load thread details.');
                }
                return threadResponse.json();
            })
            .then(thread => {
                const whetheradmin = localStorage.getItem('isAdmin');
                if (thread.creatorId === Number(localStorage.getItem('userId')) || whetheradmin === 'true') {
                    showEditForm(thread);
                } else {
                    displayThreadDetails(thread);
                }

                threadDetails.style.display = 'none';
                noneForm.style.display = 'none';
                newTopic.style.display = 'none';
                editThreadSection.style.display = 'block';
                buttonEdit.style.display = 'flex';
                editDetails.style.display = 'flex';
                editPart.style.display = 'none';
                profileScreen.style.display = 'none';
            })
            .catch(error => {
                console.error('Error updating thread:', error.message);
            });
    };

    // Delete the post
    const deleteThread = (threadId) => {
        const token = localStorage.getItem('authToken');

        fetch(`http://localhost:5005/thread`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: threadId })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to delete thread');
                }
                alert('Thread deleted successfully!');
                return loadThreads(true);
            })
            .then(() => {
                return redirectToLatestThread();
            })
            .catch(error => {
                console.error('Error deleting thread:', error.message);
            });
    };

    // Display the most recently published post
    const redirectToLatestThread = () => {
        const token = localStorage.getItem('authToken');
        const userid = localStorage.getItem('userId');

        fetch(`http://localhost:5005/threads?start=0`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    showErrorPopup('Failed to load thread IDs.');
                    return Promise.reject('Failed to load thread IDs');
                }
                return response.json();
            })
            .then(data => {
                if (data.length === 0) {
                    noneForm.style.display = 'flex';
                    threadDetails.style.display = 'none';
                    return Promise.reject('No threads available');
                }
                return fetch(`http://localhost:5005/thread?id=${data[0]}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            })
            .then(threadResponse => {
                if (!threadResponse.ok) {
                    return Promise.reject('Failed to load thread details');
                }
                return threadResponse.json();
            })
            .then(thread => {
                const whetheradmin = localStorage.getItem('isAdmin');
                if (thread.creatorId === Number(userid) || whetheradmin === 'true') {
                    showEditForm(thread);
                } else {
                    displayThreadDetails(thread);
                }
            })
            .catch(error => {
                console.error('Error redirecting to latest thread:', error);
            });
    };

    // Display the detailed content of a post from a non-current user
    const displayThreadDetails = (thread) => {
        let liked = false;
        let watching = false;

        const threadcreatorpic2 = document.getElementById('thread-creator-pic2');
        const threadcreatorname2 = document.getElementById('thread-creator-name2');
        fetchUserDetails(thread.creatorId)
            .then(({ userImage, userName, userEmail, userAdmin }) => {
                threadcreatorpic2.src = userImage;
                threadcreatorname2.textContent = userName;

                threadcreatorname2.style.cursor = 'pointer';
                threadcreatorname2.addEventListener('click', () => showUserProfile(thread.creatorId));
            })
            .catch(error => {
                console.error('Error displaying user image:', error.message);
                threadcreatorpic2.src = 'assets/default-profile.png';
            });
        const likeIcon2 = document.getElementById('like-icon2');
        const eyeIcon2 = document.getElementById('eye-icon2');
        const userId = Number(localStorage.getItem('userId'));
        const allLikes = thread.likes;
        const allwatchs = thread.watchees;
        if (allLikes.includes(userId)) {
            liked = true;
            likeIcon2.src = 'assets/like2.svg';
            likeIcon2.alt = 'like-icon2';
        } else {
            likeIcon2.src = 'assets/like1.svg';
            likeIcon2.alt = 'like-icon1';
        }
        if (allwatchs.includes(userId)) {
            watching = true;
            eyeIcon2.src = 'assets/eye2.svg';
            eyeIcon2.alt = 'eye-icon2';
        } else {
            eyeIcon2.src = 'assets/eye1.svg';
            eyeIcon2.alt = 'eye-icon1';
        }
        document.getElementById('thread-title2').textContent = thread.title;
        document.getElementById('thread-content2').textContent = thread.content;
        document.getElementById('thread-likes2').textContent = `likes: ${Object.keys(thread.likes).length}`;
        let numberLike = Object.keys(thread.likes).length;
        noneForm.style.display = 'none';
        newTopic.style.display = 'none';
        editThreadSection.style.display = 'none';
        threadDetails.style.display = 'flex';
        profileScreen.style.display = 'none';
        fetchComments2(thread.id, thread.lock);
        likeIcon2.replaceWith(likeIcon2.cloneNode(true));
        eyeIcon2.replaceWith(eyeIcon2.cloneNode(true));
        const newLikeIcon2 = document.getElementById('like-icon2');
        const neweyeIcon2 = document.getElementById('eye-icon2');

        // Like button logic
        if (thread.lock === true) {
            newLikeIcon2.style.cursor = 'not-allowed';
        } else {
            newLikeIcon2.addEventListener('click', () => {
                const token = localStorage.getItem('authToken');
                const threadId = thread.id;

                fetch(`http://localhost:5005/thread/like`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: threadId,
                        turnon: !liked
                    })
                })
                    .then(response => {
                        if (!response.ok) {
                            return response.json().then(errorData => {
                                throw new Error(errorData.message || 'Failed to update like state');
                            });
                        }

                        if (liked) {
                            numberLike = numberLike - 1;
                            newLikeIcon2.src = 'assets/like1.svg';
                            newLikeIcon2.alt = 'like-icon1';
                        } else {
                            numberLike = numberLike + 1;
                            newLikeIcon2.src = 'assets/like2.svg';
                            newLikeIcon2.alt = 'like-icon2';
                        }
                        liked = !liked;
                        loadThreads(true);
                        document.getElementById('thread-likes2').textContent = `${numberLike}`;
                    })
                    .catch(error => {
                        console.error('Error toggling like state:', error.message);
                    });
            });
        }

        // Watch button logic
        if (thread.lock === true) {
            neweyeIcon2.style.cursor = 'not-allowed';
        } else {
            neweyeIcon2.addEventListener('click', () => {
                const token = localStorage.getItem('authToken');
                const threadId = thread.id;

                fetch(`http://localhost:5005/thread/watch`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: threadId,
                        turnon: !watching
                    })
                })
                    .then(response => {
                        if (!response.ok) {
                            return response.json().then(errorData => {
                                throw new Error(errorData.message || 'Failed to update watch state');
                            });
                        }

                        if (watching) {
                            neweyeIcon2.src = 'assets/eye1.svg';
                            neweyeIcon2.alt = 'eye-icon1';
                        } else {
                            neweyeIcon2.src = 'assets/eye2.svg';
                            neweyeIcon2.alt = 'eye-icon2';
                        }
                        watching = !watching;
                        loadThreads(true);
                    })
                    .catch(error => {
                        console.error('Error toggling watch state:', error.message);
                    });
            });
        }
    };

    // Display the next posts in the left-side post list on each click
    const displayNextThreads = (count) => {
        const nextThreadIds = threadIds.slice(threadsDisplayed, threadsDisplayed + count);
        if (nextThreadIds.length === 0) {
            loadMoreButton.style.display = 'none';
            return;
        }

        nextThreadIds.forEach((id) => {
            const token = localStorage.getItem('authToken');

            fetch(`http://localhost:5005/thread?id=${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
                .then((response) => {
                    if (!response.ok) {
                        return response.json().then((errorData) => {
                            throw new Error(errorData.message || 'Failed to load thread details.');
                        });
                    }
                    return response.json();
                })
                .then((thread) => {
                    if (thread && thread.title) {
                        const threadBox = document.createElement('div');
                        threadBox.classList.add('thread-box');

                        const threadTitle = document.createElement('h2');
                        threadTitle.textContent = thread.title;

                        const threadUnder = document.createElement('div');
                        threadUnder.classList.add('thread-under');

                        const creator = document.createElement('span');
                        creator.classList.add('creator');
                        creator.textContent = thread.creatorId;

                        const time = document.createElement('span');
                        time.classList.add('time');
                        time.textContent = new Date(thread.createdAt).toLocaleString();

                        const likes = document.createElement('span');
                        likes.classList.add('likes');
                        likes.textContent = `Likes: ${Object.keys(thread.likes).length}`;

                        threadUnder.appendChild(creator);
                        threadUnder.appendChild(time);
                        threadUnder.appendChild(likes);

                        threadBox.appendChild(threadTitle);
                        threadBox.appendChild(threadUnder);

                        threadBox.addEventListener('click', () => {
                            const whetheradmin = localStorage.getItem('isAdmin');
                            const userid = localStorage.getItem('userId');
                            if (thread.creatorId === Number(userid) || whetheradmin === 'true') {
                                showEditForm(thread);
                            } else {
                                displayThreadDetails(thread);
                            }
                        });

                        threadsList.insertBefore(threadBox, loadMoreButton);
                    } else {
                        throw new Error('Thread data is undefined or invalid');
                    }
                })
                .catch((error) => {
                    console.error('Error loading thread details:', error.message);
                });
        });

        threadsDisplayed += nextThreadIds.length;
    };

    // Button to load more posts in the left-side post list
    loadMoreButton.addEventListener('click', () => {
        loadThreads();
        displayNextThreads(5);
    });

    registerForm.style.display = 'none';
    dashboardContainer.style.display = 'none';

    const token = localStorage.getItem('authToken');
    const userid = localStorage.getItem('userId');
    if (token) {
        startContainer.style.display = 'none';
        dashboardContainer.style.display = 'flex';
        noneForm.style.display = 'flex';
        newTopic.style.display = 'none';
        profileScreen.style.display = 'none';
        loadThreads();
    }

    // Create a new post
    createTopic.addEventListener('click', () => {
        document.getElementById('post-title').value = "";
        document.getElementById('post-content').value = "";
        document.getElementById('post-public').checked = false;
        noneForm.style.display = 'none';
        threadDetails.style.display = 'none'
        newTopic.style.display = 'flex';
        profileScreen.style.display = 'none';
    });

    // Cancel publishing a new post
    postCancel.addEventListener('click', () => {
        newTopic.style.display = 'none';
        threadDetails.style.display = 'none'
        editThreadSection.style.display = 'none';
        noneForm.style.display = 'flex';
    });

    // Publish a new post
    postSubmit.addEventListener('click', (event) => {
        event.preventDefault();

        const title = document.getElementById('post-title').value;
        const content = document.getElementById('post-content').value;
        const isPublic = !document.getElementById('post-public').checked;
        const token = localStorage.getItem('authToken');

        fetch(`http://localhost:5005/thread`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title,
                content: content,
                isPublic: isPublic
            })
        })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then((errorData) => {
                        throw new Error(errorData.message || 'Failed to create thread');
                    });
                }
                return response.json();
            })
            .then(() => {
                loadThreads(true);
                return redirectToLatestThread();
            })
            .catch((error) => {
                console.error('Error creating thread:', error.message);
            });
    });

    // Navigate to the registration page
    window.goto_register = function () {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    };

    // Navigate to the login page
    window.goto_login = function () {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    };

    // show ErrorPopup
    function showErrorPopup(message) {
        const popup = document.createElement('div');
        popup.classList.add('error-popup');

        const errorContent = document.createElement('div');
        errorContent.classList.add('error-content');

        const closeIcon = document.createElement('span');
        closeIcon.classList.add('close-icon');
        closeIcon.innerHTML = '&times;';

        const messageParagraph = document.createElement('p');
        messageParagraph.textContent = message;

        const closeButton = document.createElement('button');
        closeButton.classList.add('close-button');
        closeButton.textContent = 'Close';

        errorContent.appendChild(closeIcon);
        errorContent.appendChild(messageParagraph);
        errorContent.appendChild(closeButton);

        popup.appendChild(errorContent);

        popup.querySelectorAll('.close-icon, .close-button').forEach((btn) => {
            btn.addEventListener('click', () => {
                popup.remove();
            });
        });
        document.body.appendChild(popup);
    }

    // Register a new account
    window.make_register = function (event) {
        event.preventDefault();

        const email = document.getElementById('register-email').value;
        const name = document.getElementById('register-name').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (password !== confirmPassword) {
            showErrorPopup('Passwords do not match, please re-enter.');
            return;
        }

        fetch(`http://localhost:5005/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, name, password })
        })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then((errorData) => {
                        showErrorPopup(errorData.message || 'Please try again.');
                        throw new Error('Registration failed');
                    });
                }
                alert('Registration successful! Redirecting to the login page.');
                loginForm.style.display = 'block';
                registerForm.style.display = 'none';
            })
            .catch((error) => {
                console.error('Error during registration:', error.message);
                showErrorPopup('Unable to connect. Please check your network and try again.');
            });
    };

    // User login
    window.make_login = function (event) {
        event.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        fetch(`http://localhost:5005/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then((errorData) => {
                        showErrorPopup(errorData.message || 'Login failed. Please check your credentials and try again.');
                        throw new Error('Login failed');
                    });
                }
                return response.json();
            })
            .then((data) => {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('userPassword', password);

                return fetch(`http://localhost:5005/user?userId=${data.userId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${data.token}`,
                        'Content-Type': 'application/json'
                    }
                });
            })
            .then((userResponse) => {
                if (userResponse.ok) {
                    return userResponse.json().then((userData) => {
                        localStorage.setItem('isAdmin', userData.admin);
                    });
                }
            })
            .then(() => {
                startContainer.style.display = 'none';
                dashboardContainer.style.display = 'flex';
                noneForm.style.display = 'flex';
                newTopic.style.display = 'none';
                threadDetails.style.display = 'none';
                editThreadSection.style.display = 'none';
                profileScreen.style.display = 'none';
                loadThreads();
            })
            .catch((error) => {
                console.error('Error during login:', error.message);
                showErrorPopup('Unable to connect. Please check your network and try again.');
            });
    };

    // Display the user's profile
    userProfilePic.addEventListener('click', () => {
        const userId = localStorage.getItem('userId');
        showUserProfile(userId);
        noneForm.style.display = "none";
    });

    // User logout
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('threadIds');
        localStorage.removeItem('userPassword');
        dashboardContainer.style.display = 'none';
        startContainer.style.display = 'block';
    });
});